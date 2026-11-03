const {taskSchema, patchTaskSchema} = require('../validation/taskSchema.js');

let taskId = 0;

const taskCounter = () => {
    return ++taskId;
};

const create = async (req, res) => {
    if (!req.body) req.body = {};

    const {error, value} = taskSchema.validate(req.body);

    if (error) return res.status(400).json({
        error: error.details[0].message
    });

    const task = {
        ...value,
        id: taskCounter(),
        userId: global.user_id.email,
    };

    global.tasks.push(task);

    const {userId, ...sanitizedTask} = task;
    res.status(201).json(sanitizedTask);
};

const index = async (req, res) => {
    const userTasks = global.tasks.filter(
        (task) => task.userId === global.user_id.email
    );

    if (userTasks.length === 0) {
        return res.status(404).json({
            error: "No tasks found."
        });
    }

    const sanitizedTasks = userTasks.map((task) => {
        const {userId, ...sanitizedTask} = task;
        return sanitizedTask;
    });

    return res.status(200).json(sanitizedTasks);

};

const show = async (req, res) => {
    const taskId = parseInt(req.params?.id, 10);

    if (!Number.isInteger(taskId) || !/^\d+$/.test(req.params?.id ?? "")) {
        return res.status(400).json({
            error: "Invalid task ID."
        });
    }

    const task = global.tasks.find(
        (item) =>
            item.id === taskId &&
            item.userId === global.user_id.email
    );

    if (!task) {
        return res.status(404).json({
            error: "Task not found."
        });
    }

    const {userId, ...sanitizedTask} = task;

    return res.status(200).json(sanitizedTask);
};

const update = async (req, res) => {
    if (!req.body) req.body = {};

    const {error, value} = patchTaskSchema.validate(req.body);

    if (error) return res.status(400).json({
        error: error.details[0].message
    });

    const taskId = parseInt(req.params?.id, 10);

    if (!Number.isInteger(taskId) || !/^\d+$/.test(req.params?.id ?? "")) {
        return res.status(400).json({
            error: "Invalid task ID."
        });
    }

    const task = global.tasks.find(
        (task) =>
            task.id === taskId &&
            task.userId === global.user_id.email
    );

    if (!task) {
        return res.status(404).json({
            error: "Task not found."
        });
    }

    Object.assign(task, value);

    const {userId, ...sanitizedTask} = task;

    return res.status(200).json(sanitizedTask);
};


const deleteTask = async (req, res) => {

    const taskId = parseInt(req.params?.id, 10);

    if (!Number.isInteger(taskId) || !/^\d+$/.test(req.params?.id ?? "")) {
        return res.status(400).json({
            error: "Invalid task ID."
        });
    }

    const taskIndex = global.tasks.findIndex(
        (task) =>
            task.id === taskId &&
            task.userId === global.user_id.email
    );

    if (taskIndex === -1) {
        return res.status(404).json({
            error: "Task not found."
        });
    }

    const {userId, ...sanitizedTask} = global.tasks[taskIndex];

    global.tasks.splice(taskIndex, 1);

    return res.status(200).json(sanitizedTask);
};


module.exports = {create, index, show, update, deleteTask};


