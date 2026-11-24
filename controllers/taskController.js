const {taskSchema, patchTaskSchema} = require('../validation/taskSchema.js');
const prisma = require("../db/prisma");

const create = async (req, res) => {
    if (!req.body) req.body = {};

    const {error, value} = taskSchema.validate(req.body);

    if (error) {
        return res.status(400).json({
            error: error.details[0].message,
        });
    }

    const task = await prisma.task.create({
        data: {
            title: value.title,
            isCompleted: value.isCompleted,
            priority: value.priority,
            userId: global.user_id,
        },
        select: {
            id: true,
            title: true,
            isCompleted: true,
            priority: true,
        }
    });

    res.status(201).json(task);
};

const index = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const tasks = await prisma.task.findMany({
        where: {
            userId: global.user_id,
        },
        select: {
            id: true,
            title: true,
            isCompleted: true,
            priority: true,
            createdAt: true,
            User: {
                select: {
                    name: true,
                    email: true
                }
            }
        },
        skip: skip,
        take: limit,
        orderBy: {createdAt: 'desc'}
    });

    const totalTasks = await prisma.task.count({
        where: {userId: global.user_id}
    });

    const pagination = {
        page,
        limit,
        total: totalTasks,
        pages: Math.ceil(totalTasks / limit),
        hasNext: page * limit < totalTasks,
        hasPrev: page > 1
    };

    res.status(200).json({
        tasks,
        pagination
    });

    if (tasks.length === 0) {
        return res.status(404).json({
            error: "No tasks found."
        });
    }
};

const show = async (req, res, next) => {
    const id = parseInt(req.params?.id, 10);

    if (!Number.isInteger(id) || !/^\d+$/.test(req.params?.id ?? "")) {
        return res.status(400).json({
            error: "Invalid task ID.",
        });
    }

    try {
        const task = await prisma.task.findUnique({
            where: {
                id,
                userId: global.user_id,
            },
            select: {
                id: true,
                title: true,
                isCompleted: true,
            },
        });

        if (!task) {
            return res.status(404).json({
                error: "Task not found.",
            });
        }

        return res.status(200).json(task);
    } catch (err) {
        return next(err);
    }
};

const update = async (req, res, next) => {
    if (!req.body) req.body = {};

    const {error, value} = patchTaskSchema.validate(req.body);

    if (error) {
        return res.status(400).json({
            error: error.details[0].message,
        });
    }

    const id = parseInt(req.params?.id, 10);

    if (!Number.isInteger(id) || !/^\d+$/.test(req.params?.id ?? "")) {
        return res.status(400).json({
            error: "Invalid task ID.",
        });
    }

    if (Object.keys(value).length === 0) {
        return res.status(400).json({
            error: "No task fields to update.",
        });
    }

    try {
        const task = await prisma.task.update({
            data: value,
            where: {
                id,
                userId: global.user_id,
            },
            select: {
                title: true,
                isCompleted: true,
                id: true,
            },
        });

        return res.status(200).json(task);
    } catch (err) {
        if (err.code === "P2025") {
            return res.status(404).json({
                message: "The task was not found.",
            });
        }

        return next(err);
    }
};

const deleteTask = async (req, res, next) => {
    const id = parseInt(req.params?.id, 10);

    if (!Number.isInteger(id) || !/^\d+$/.test(req.params?.id ?? "")) {
        return res.status(400).json({
            error: "Invalid task ID.",
        });
    }

    try {
        const task = await prisma.task.delete({
            where: {
                id,
                userId: global.user_id,
            },
            select: {
                id: true,
                title: true,
                isCompleted: true,
            },
        });

        return res.status(200).json(task);
    } catch (err) {
        if (err.code === "P2025") {
            return res.status(404).json({
                message: "The task was not found.",
            });
        }

        return next(err);
    }
};

module.exports = {create, index, show, update, deleteTask};


