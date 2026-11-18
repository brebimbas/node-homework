const {taskSchema, patchTaskSchema} = require('../validation/taskSchema.js');
const pool = require("../db/pg-pool");
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
            userId: global.user_id,
        },
        select: {
            id: true,
            title: true,
            isCompleted: true,
        }
    });

    res.status(201).json(task);
};

const index = async (req, res) => {
    const tasks = await prisma.task.findMany({
        where: {userId: global.user_id,},
        select: {title: true, isCompleted: true, id: true}
    });
    if (tasks.length === 0) {
        return res.status(404).json({
            error: "No tasks found."
        });
    }
    return res.status(200).json(tasks);
};

const show = async (req, res) => {
    const taskId = parseInt(req.params?.id, 10);

    if (!Number.isInteger(taskId) || !/^\d+$/.test(req.params?.id ?? "")) {
        return res.status(400).json({
            error: "Invalid task ID.",
        });
    }

    const result = await pool.query(
        `SELECT id, title, is_completed
         FROM tasks
         WHERE id = $1
           AND user_id = $2`,
        [taskId, global.user_id]
    );

    const task = result.rows[0];

    if (!task) {
        return res.status(404).json({
            error: "Task not found.",
        });
    }

    return res.status(200).json(task);
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

const deleteTask = async (req, res) => {
    const taskId = parseInt(req.params?.id, 10);

    if (!Number.isInteger(taskId) || !/^\d+$/.test(req.params?.id ?? "")) {
        return res.status(400).json({
            error: "Invalid task ID.",
        });
    }

    const result = await pool.query(
        `DELETE
         FROM tasks
         WHERE id = $1
           AND user_id = $2 RETURNING id, title, is_completed`,
        [taskId, global.user_id]
    );

    const deletedTask = result.rows[0];

    if (!deletedTask) {
        return res.status(404).json({
            error: "Task not found.",
        });
    }

    return res.status(200).json(deletedTask);
};


module.exports = {create, index, show, update, deleteTask};


