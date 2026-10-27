let taskId = 0;

const taskCounter = () => {
    return ++taskId;
};

const task = {
    id: taskCounter(),
    title: req.body.title,
    isComplete: false,
    userId: global.user_id.email
};

global.tasks.push(task);

const {userID, ...sanitizedTask} = task;
res.status(200).json(sanitizedTask);


