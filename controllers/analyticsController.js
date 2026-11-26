const prisma = require("../db/prisma");

async function getUserAnalytics(req, res, next) {
    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
        return res.status(400).json({
            error: "Invalid user ID.",
        });
    }

    try {
        const user = await prisma.user.findUnique({
            where: {id: userId},
            select: {id: true},
        });

        if (!user) {
            return res.status(404).json({
                error: "User not found",
            });
        }

        const taskStats = await prisma.task.groupBy({
            by: ["isCompleted"],
            where: {userId},
            _count: {
                id: true,
            },
        });

        const recentTasks = await prisma.task.findMany({
            where: {userId},
            select: {
                id: true,
                title: true,
                isCompleted: true,
                priority: true,
                createdAt: true,
                userId: true,
                User: {
                    select: {name: true},
                },
            },
            orderBy: {createdAt: "desc"},
            take: 10,
        });

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const weeklyProgress = await prisma.task.groupBy({
            by: ["createdAt"],
            where: {
                userId,
                createdAt: {gte: oneWeekAgo},
            },
            _count: {
                id: true,
            },
        });

        return res.status(200).json({
            taskStats,
            recentTasks,
            weeklyProgress,
        });
    } catch (err) {
        return next(err);
    }
}

async function getUsersWithStats(req, res, next) {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const skip = (page - 1) * limit;

    try {
        const usersRaw = await prisma.user.findMany({
            include: {
                Task: {
                    where: {isCompleted: false},
                    select: {id: true},
                    take: 5,
                },
                _count: {
                    select: {
                        Task: true,
                    },
                },
            },
            skip,
            take: limit,
            orderBy: {createdAt: "desc"},
        });

        const users = usersRaw.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
            _count: user._count,
            Task: user.Task,
        }));

        const total = await prisma.user.count();
        const pages = Math.ceil(total / limit);

        return res.status(200).json({
            users,
            pagination: {
                page,
                limit,
                total,
                pages,
                hasNext: page < pages,
                hasPrev: page > 1,
            },
        });
    } catch (err) {
        return next(err);
    }
}

async function searchTasks(req, res, next) {
    const searchQuery =
        typeof req.query.q === "string" ? req.query.q.trim() : "";

    if (searchQuery.length < 2) {
        return res.status(400).json({
            error: "Search query must be at least 2 characters long",
        });
    }

    const parsedLimit = parseInt(req.query.limit, 10);
    const limit = Number.isFinite(parsedLimit)
        ? Math.min(Math.max(parsedLimit, 1), 100)
        : 20;

    const searchPattern = `%${searchQuery}%`;
    const startsWith = `${searchQuery}%`;

    try {
        const results = await prisma.$queryRaw`
            SELECT t.id,
                   t.title,
                   t.is_completed AS "isCompleted",
                   t.created_at   AS "createdAt",
                   t.priority,
                   t.user_id      AS "userId",
                   u.name         AS "user_name"
            FROM tasks t
                     JOIN users u ON t.user_id = u.id
            WHERE t.title ILIKE ${searchPattern}
               OR u.name ILIKE ${searchPattern}
            ORDER BY
                CASE
                WHEN t.title ILIKE ${searchQuery} THEN 1
                WHEN t.title ILIKE ${startsWith} THEN 2
                WHEN t.title ILIKE ${searchPattern} THEN 3
                ELSE 4
            END
            ,
                t.created_at DESC
            LIMIT
            ${limit}
        `;

        return res.status(200).json({
            results,
            query: searchQuery,
            count: results.length,
        });
    } catch (err) {
        return next(err);
    }
}

module.exports = {getUserAnalytics, getUsersWithStats, searchTasks};