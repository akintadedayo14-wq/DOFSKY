const API = "/api";

let clients = [];
let projects = [];
let tasks = [];

let selectedClient = null;
let selectedProject = null;
let selectedTask = null;


/* ========================================
   API
======================================== */

async function apiRequest(url, options = {}) {
    const response = await fetch(API + url, {
        headers: {
            "Content-Type": "application/json"
        },
        ...options
    });

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }

    return response.json();
}


/* ========================================
   Helpers
======================================== */

function formatStatus(status) {
    if (!status) {
        return "—";
    }

    return status
        .replace("-", " ")
        .replace(/\b\w/g, letter => letter.toUpperCase());
}


function formatDate(date) {
    if (!date) {
        return "—";
    }

    return new Date(date).toLocaleDateString();
}


function getClientName(clientId) {
    const client = clients.find(
        item => Number(item.id) === Number(clientId)
    );

    return client ? client.name : "No client";
}


function getProjectName(projectId) {
    const project = projects.find(
        item => Number(item.id) === Number(projectId)
    );

    return project ? project.name : "No project";
}


/* ========================================
   Mobile Navigation
======================================== */

const sidebar = document.getElementById("sidebar");
const menuButton = document.getElementById("menuButton");

if (menuButton && sidebar) {
    menuButton.addEventListener("click", () => {
        const isOpen = sidebar.classList.toggle("open");

        menuButton.setAttribute(
            "aria-expanded",
            isOpen ? "true" : "false"
        );
    });
}


/* ========================================
   Load Data
======================================== */

async function loadData() {
    try {
        const [
            clientsData,
            projectsData,
            tasksData
        ] = await Promise.all([
            apiRequest("/clients"),
            apiRequest("/projects"),
            apiRequest("/tasks")
        ]);

        clients = clientsData;
        projects = projectsData;
        tasks = tasksData;

        renderPage();
    } catch (error) {
        console.error("Could not load DOFSKY data:", error);
    }
}


/* ========================================
   Page Detection
======================================== */

function renderPage() {
    const page = window.location.pathname.split("/").pop();

    if (page === "index.html" || page === "") {
        renderDashboard();
    }

    if (page === "projects.html") {
        renderProjects();
        populateProjectClients();
    }

    if (page === "clients.html") {
        renderClients();
    }

    if (page === "tasks.html") {
        renderTasks();
        populateTaskProjects();
    }

    if (page === "settings.html") {
        loadAccount();
    }
}


/* ========================================
   Dashboard
======================================== */

function renderDashboard() {
    const clientCount =
        document.getElementById("dashboardClientCount");

    const projectCount =
        document.getElementById("dashboardProjectCount");

    const taskCount =
        document.getElementById("dashboardTaskCount");

    if (clientCount) {
        clientCount.textContent = clients.length;
    }

    if (projectCount) {
        projectCount.textContent = projects.length;
    }

    if (taskCount) {
        taskCount.textContent = tasks.length;
    }


    const recentProjects =
        document.getElementById("recentProjects");

    if (recentProjects) {
        if (projects.length === 0) {
            recentProjects.innerHTML = `
                <div class="empty-state">
                    <strong>No projects yet</strong>
                    <span>Your recent projects will appear here.</span>
                </div>
            `;
        } else {
            recentProjects.innerHTML = projects
                .slice(0, 5)
                .map(project => `
                    <div class="dashboard-list-item">

                        <div class="list-content">
                            <strong>${escapeHTML(project.name)}</strong>

                            <span>
                                ${escapeHTML(
                                    project.client_name ||
                                    getClientName(project.client_id)
                                )}
                            </span>
                        </div>

                    </div>
                `)
                .join("");
        }
    }


    const recentTasks =
        document.getElementById("recentTasks");

    if (recentTasks) {
        if (tasks.length === 0) {
            recentTasks.innerHTML = `
                <div class="empty-state">
                    <strong>No tasks yet</strong>
                    <span>Your recent tasks will appear here.</span>
                </div>
            `;
        } else {
            recentTasks.innerHTML = tasks
                .slice(0, 5)
                .map(task => `
                    <div class="dashboard-list-item">

                        <div class="list-content">
                            <strong>${escapeHTML(task.title)}</strong>

                            <span>
                                ${escapeHTML(
                                    task.project_name ||
                                    getProjectName(task.project_id)
                                )}
                            </span>
                        </div>

                    </div>
                `)
                .join("");
        }
    }
}


/* ========================================
   Projects
======================================== */

function renderProjects() {
    const list = document.getElementById("projectList");

    if (!list) {
        return;
    }

    if (projects.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <strong>No projects yet</strong>
                <span>Create your first project.</span>
            </div>
        `;

        return;
    }

    list.innerHTML = projects
        .map(project => `
            <div class="project-list-item">

                <div class="list-content">

                    <strong>
                        ${escapeHTML(project.name)}
                    </strong>

                    <span>
                        ${escapeHTML(
                            project.client_name ||
                            getClientName(project.client_id)
                        )}
                        ·
                        ${escapeHTML(formatStatus(project.status))}
                    </span>

                </div>

                <div class="list-actions">

                    <button
                        type="button"
                        class="secondary-button"
                        data-project-id="${project.id}"
                    >
                        View
                    </button>

                </div>

            </div>
        `)
        .join("");

    list.querySelectorAll("[data-project-id]")
        .forEach(button => {
            button.addEventListener("click", () => {

                const project = projects.find(
                    item =>
                        Number(item.id) ===
                        Number(button.dataset.projectId)
                );

                if (project) {
                    showProjectDetails(project);
                }
            });
        });
}


/* ========================================
   Project Details
======================================== */

function showProjectDetails(project) {
    selectedProject = project;

    const listSection =
        document.getElementById("projectsListSection");

    const detailsPanel =
        document.getElementById("projectDetailsPanel");

    const formPanel =
        document.getElementById("projectFormPanel");

    const editPanel =
        document.getElementById("projectEditPanel");

    if (listSection) {
        listSection.hidden = true;
    }

    if (formPanel) {
        formPanel.hidden = true;
    }

    if (editPanel) {
        editPanel.hidden = true;
    }

    if (detailsPanel) {
        detailsPanel.hidden = false;
    }

    document.getElementById("detailsProjectName").textContent =
        project.name || "—";

    document.getElementById("detailsProjectClient").textContent =
        project.client_name ||
        getClientName(project.client_id);

    document.getElementById("detailsProjectStatus").textContent =
        formatStatus(project.status);

    document.getElementById("detailsProjectDeadline").textContent =
        formatDate(project.deadline);

    document.getElementById("detailsProjectDescription").textContent =
        project.description || "—";
}


/* ========================================
   New Project
======================================== */

function openProjectForm() {
    const listSection =
        document.getElementById("projectsListSection");

    const detailsPanel =
        document.getElementById("projectDetailsPanel");

    const editPanel =
        document.getElementById("projectEditPanel");

    const formPanel =
        document.getElementById("projectFormPanel");

    if (listSection) {
        listSection.hidden = true;
    }

    if (detailsPanel) {
        detailsPanel.hidden = true;
    }

    if (editPanel) {
        editPanel.hidden = true;
    }

    if (formPanel) {
        formPanel.hidden = false;
    }
}


const newProjectButton =
    document.getElementById("newProjectButton");

const mobileNewProjectButton =
    document.getElementById("mobileNewProjectButton");

if (newProjectButton) {
    newProjectButton.addEventListener(
        "click",
        openProjectForm
    );
}

if (mobileNewProjectButton) {
    mobileNewProjectButton.addEventListener(
        "click",
        openProjectForm
    );
}


/* ========================================
   Project Form
======================================== */

const projectForm =
    document.getElementById("projectForm");

if (projectForm) {
    projectForm.addEventListener(
        "submit",
        async event => {
            event.preventDefault();

            const project = {
                name:
                    document.getElementById(
                        "projectName"
                    ).value.trim(),

                client_id:
                    document.getElementById(
                        "projectClient"
                    ).value || null,

                description:
                    document.getElementById(
                        "projectDescription"
                    ).value.trim(),

                start_date:
                    document.getElementById(
                        "projectStartDate"
                    ).value || null,

                deadline:
                    document.getElementById(
                        "projectDeadline"
                    ).value || null,

                status:
                    document.getElementById(
                        "projectStatus"
                    ).value
            };

            try {
                await apiRequest("/projects", {
                    method: "POST",
                    body: JSON.stringify(project)
                });

                projectForm.reset();

                await loadData();

                const formPanel =
                    document.getElementById(
                        "projectFormPanel"
                    );

                const listSection =
                    document.getElementById(
                        "projectsListSection"
                    );

                if (formPanel) {
                    formPanel.hidden = true;
                }

                if (listSection) {
                    listSection.hidden = false;
                }

            } catch (error) {
                console.error(
                    "Could not save project:",
                    error
                );
            }
        }
    );
}


/* ========================================
   Project Back Button
======================================== */

const backToProjectsButton =
    document.getElementById("backToProjectsButton");

if (backToProjectsButton) {
    backToProjectsButton.addEventListener(
        "click",
        () => {

            document.getElementById(
                "projectDetailsPanel"
            ).hidden = true;

            document.getElementById(
                "projectEditPanel"
            ).hidden = true;

            document.getElementById(
                "projectFormPanel"
            ).hidden = true;

            document.getElementById(
                "projectsListSection"
            ).hidden = false;
        }
    );
}


/* ========================================
   Project Edit
======================================== */

const editProjectButton =
    document.getElementById("editProjectButton");

if (editProjectButton) {
    editProjectButton.addEventListener(
        "click",
        () => {

            if (!selectedProject) {
                return;
            }

            document.getElementById(
                "projectDetailsPanel"
            ).hidden = true;

            document.getElementById(
                "projectEditPanel"
            ).hidden = false;

            document.getElementById(
                "editProjectId"
            ).value = selectedProject.id;

            document.getElementById(
                "editProjectName"
            ).value = selectedProject.name || "";

            document.getElementById(
                "editProjectClient"
            ).value =
                selectedProject.client_id || "";

            document.getElementById(
                "editProjectDescription"
            ).value =
                selectedProject.description || "";

            document.getElementById(
                "editProjectStartDate"
            ).value =
                selectedProject.start_date || "";

            document.getElementById(
                "editProjectDeadline"
            ).value =
                selectedProject.deadline || "";

            document.getElementById(
                "editProjectStatus"
            ).value =
                selectedProject.status || "planning";
        }
    );
}


const projectEditForm =
    document.getElementById("projectEditForm");

if (projectEditForm) {
    projectEditForm.addEventListener(
        "submit",
        async event => {
            event.preventDefault();

            const id =
                document.getElementById(
                    "editProjectId"
                ).value;

            const project = {
                name:
                    document.getElementById(
                        "editProjectName"
                    ).value.trim(),

                client_id:
                    document.getElementById(
                        "editProjectClient"
                    ).value || null,

                description:
                    document.getElementById(
                        "editProjectDescription"
                    ).value.trim(),

                start_date:
                    document.getElementById(
                        "editProjectStartDate"
                    ).value || null,

                deadline:
                    document.getElementById(
                        "editProjectDeadline"
                    ).value || null,

                status:
                    document.getElementById(
                        "editProjectStatus"
                    ).value
            };

            try {
                await apiRequest(`/projects/${id}`, {
                    method: "PUT",
                    body: JSON.stringify(project)
                });

                await loadData();

                const updated =
                    projects.find(
                        item =>
                            Number(item.id) ===
                            Number(id)
                    );

                if (updated) {
                    showProjectDetails(updated);
                }

            } catch (error) {
                console.error(
                    "Could not update project:",
                    error
                );
            }
        }
    );
}


const cancelEditProjectButton =
    document.getElementById(
        "cancelEditProjectButton"
    );

if (cancelEditProjectButton) {
    cancelEditProjectButton.addEventListener(
        "click",
        () => {

            if (selectedProject) {
                showProjectDetails(selectedProject);
            }
        }
    );
}


/* ========================================
   Project Clients
======================================== */

function populateProjectClients() {
    const selects = [
        document.getElementById("projectClient"),
        document.getElementById("editProjectClient")
    ];

    selects.forEach(select => {

        if (!select) {
            return;
        }

        const currentValue = select.value;

        select.innerHTML = `
            <option value="">No client</option>
        `;

        clients.forEach(client => {

            const option =
                document.createElement("option");

            option.value = client.id;
            option.textContent = client.name;

            select.appendChild(option);
        });

        if (currentValue) {
            select.value = currentValue;
        }
    });
}


/* ========================================
   Clients
======================================== */

function renderClients() {
    const list =
        document.getElementById("clientList");

    if (!list) {
        return;
    }

    if (clients.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <strong>No clients yet</strong>
                <span>Add your first client.</span>
            </div>
        `;

        return;
    }

    list.innerHTML = clients
        .map(client => `
            <div class="client-list-item">

                <div class="list-content">

                    <strong>
                        ${escapeHTML(client.name)}
                    </strong>

                    <span>
                        ${escapeHTML(
                            client.company || "No company"
                        )}
                    </span>

                </div>

                <div class="list-actions">

                    <button
                        type="button"
                        class="secondary-button"
                        data-client-id="${client.id}"
                    >
                        View
                    </button>

                </div>

            </div>
        `)
        .join("");

    list.querySelectorAll("[data-client-id]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const client =
                        clients.find(
                            item =>
                                Number(item.id) ===
                                Number(button.dataset.clientId)
                        );

                    if (client) {
                        showClientDetails(client);
                    }
                }
            );
        });
}


/* ========================================
   Client Details
======================================== */

function showClientDetails(client) {
    selectedClient = client;

    document.getElementById(
        "clientsListSection"
    ).hidden = true;

    document.getElementById(
        "clientFormPanel"
    ).hidden = true;

    document.getElementById(
        "clientEditPanel"
    ).hidden = true;

    document.getElementById(
        "clientDetailsPanel"
    ).hidden = false;

    document.getElementById(
        "detailsClientName"
    ).textContent = client.name || "—";

    document.getElementById(
        "detailsClientCompany"
    ).textContent = client.company || "—";

    document.getElementById(
        "detailsClientEmail"
    ).textContent = client.email || "—";

    document.getElementById(
        "detailsClientPhone"
    ).textContent = client.phone || "—";

    document.getElementById(
        "detailsClientNotes"
    ).textContent = client.notes || "—";

    document.getElementById(
        "detailsClientCreated"
    ).textContent = formatDate(client.created_at);
}


/* ========================================
   New Client
======================================== */

function openClientForm() {
    document.getElementById(
        "clientsListSection"
    ).hidden = true;

    document.getElementById(
        "clientDetailsPanel"
    ).hidden = true;

    document.getElementById(
        "clientEditPanel"
    ).hidden = true;

    document.getElementById(
        "clientFormPanel"
    ).hidden = false;
}


const newClientButton =
    document.getElementById("newClientButton");

const mobileNewClientButton =
    document.getElementById("mobileNewClientButton");

if (newClientButton) {
    newClientButton.addEventListener(
        "click",
        openClientForm
    );
}

if (mobileNewClientButton) {
    mobileNewClientButton.addEventListener(
        "click",
        openClientForm
    );
}


const clientForm =
    document.getElementById("clientForm");

if (clientForm) {
    clientForm.addEventListener(
        "submit",
        async event => {
            event.preventDefault();

            const client = {
                name:
                    document.getElementById(
                        "clientName"
                    ).value.trim(),

                company:
                    document.getElementById(
                        "clientCompany"
                    ).value.trim(),

                email:
                    document.getElementById(
                        "clientEmail"
                    ).value.trim(),

                phone:
                    document.getElementById(
                        "clientPhone"
                    ).value.trim(),

                notes:
                    document.getElementById(
                        "clientNotes"
                    ).value.trim()
            };

            try {
                await apiRequest("/clients", {
                    method: "POST",
                    body: JSON.stringify(client)
                });

                clientForm.reset();

                await loadData();

                document.getElementById(
                    "clientFormPanel"
                ).hidden = true;

                document.getElementById(
                    "clientsListSection"
                ).hidden = false;

            } catch (error) {
                console.error(
                    "Could not save client:",
                    error
                );
            }
        }
    );
}


/* ========================================
   Client Back
======================================== */

const backToClientsButton =
    document.getElementById(
        "backToClientsButton"
    );

if (backToClientsButton) {
    backToClientsButton.addEventListener(
        "click",
        () => {

            document.getElementById(
                "clientDetailsPanel"
            ).hidden = true;

            document.getElementById(
                "clientEditPanel"
            ).hidden = true;

            document.getElementById(
                "clientFormPanel"
            ).hidden = true;

            document.getElementById(
                "clientsListSection"
            ).hidden = false;
        }
    );
}


/* ========================================
   Client Edit
======================================== */

const editClientButton =
    document.getElementById(
        "editClientButton"
    );

if (editClientButton) {
    editClientButton.addEventListener(
        "click",
        () => {

            if (!selectedClient) {
                return;
            }

            document.getElementById(
                "clientDetailsPanel"
            ).hidden = true;

            document.getElementById(
                "clientEditPanel"
            ).hidden = false;

            document.getElementById(
                "editClientId"
            ).value = selectedClient.id;

            document.getElementById(
                "editClientName"
            ).value = selectedClient.name || "";

            document.getElementById(
                "editClientCompany"
            ).value = selectedClient.company || "";

            document.getElementById(
                "editClientEmail"
            ).value = selectedClient.email || "";

            document.getElementById(
                "editClientPhone"
            ).value = selectedClient.phone || "";

            document.getElementById(
                "editClientNotes"
            ).value = selectedClient.notes || "";
        }
    );
}


const clientEditForm =
    document.getElementById(
        "clientEditForm"
    );

if (clientEditForm) {
    clientEditForm.addEventListener(
        "submit",
        async event => {
            event.preventDefault();

            const id =
                document.getElementById(
                    "editClientId"
                ).value;

            const client = {
                name:
                    document.getElementById(
                        "editClientName"
                    ).value.trim(),

                company:
                    document.getElementById(
                        "editClientCompany"
                    ).value.trim(),

                email:
                    document.getElementById(
                        "editClientEmail"
                    ).value.trim(),

                phone:
                    document.getElementById(
                        "editClientPhone"
                    ).value.trim(),

                notes:
                    document.getElementById(
                        "editClientNotes"
                    ).value.trim()
            };

            try {
                await apiRequest(`/clients/${id}`, {
                    method: "PUT",
                    body: JSON.stringify(client)
                });

                await loadData();

                const updated =
                    clients.find(
                        item =>
                            Number(item.id) ===
                            Number(id)
                    );

                if (updated) {
                    showClientDetails(updated);
                }

            } catch (error) {
                console.error(
                    "Could not update client:",
                    error
                );
            }
        }
    );
}


const cancelEditClientButton =
    document.getElementById(
        "cancelEditClientButton"
    );

if (cancelEditClientButton) {
    cancelEditClientButton.addEventListener(
        "click",
        () => {

            if (selectedClient) {
                showClientDetails(selectedClient);
            }
        }
    );
}


/* ========================================
   Tasks
======================================== */

function renderTasks() {
    const list =
        document.getElementById("taskList");

    if (!list) {
        return;
    }

    if (tasks.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <strong>No tasks yet</strong>
                <span>Create your first task.</span>
            </div>
        `;

        return;
    }

    list.innerHTML = tasks
        .map(task => `
            <div class="task-list-item">

                <div class="list-content">

                    <strong>
                        ${escapeHTML(task.title)}
                    </strong>

                    <span>
                        ${escapeHTML(
                            task.project_name ||
                            getProjectName(task.project_id)
                        )}
                        ·
                        ${escapeHTML(
                            formatStatus(task.status)
                        )}
                    </span>

                </div>

                <div class="list-actions">

                    <button
                        type="button"
                        class="secondary-button"
                        data-task-id="${task.id}"
                    >
                        View
                    </button>

                </div>

            </div>
        `)
        .join("");

    list.querySelectorAll("[data-task-id]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const task =
                        tasks.find(
                            item =>
                                Number(item.id) ===
                                Number(button.dataset.taskId)
                        );

                    if (task) {
                        showTaskDetails(task);
                    }
                }
            );
        });
}


/* ========================================
   Task Details
======================================== */

function showTaskDetails(task) {
    selectedTask = task;

    document.getElementById(
        "tasksListSection"
    ).hidden = true;

    document.getElementById(
        "taskFormPanel"
    ).hidden = true;

    document.getElementById(
        "taskEditPanel"
    ).hidden = true;

    document.getElementById(
        "taskDetailsPanel"
    ).hidden = false;

    document.getElementById(
        "detailsTaskName"
    ).textContent = task.title || "—";

    document.getElementById(
        "detailsTaskProject"
    ).textContent =
        task.project_name ||
        getProjectName(task.project_id);

    document.getElementById(
        "detailsTaskStatus"
    ).textContent =
        formatStatus(task.status);

    document.getElementById(
        "detailsTaskDeadline"
    ).textContent =
        formatDate(task.deadline);

    document.getElementById(
        "detailsTaskDescription"
    ).textContent =
        task.description || "—";

    document.getElementById(
        "detailsTaskCreated"
    ).textContent =
        formatDate(task.created_at);
}


/* ========================================
   New Task
======================================== */

function openTaskForm() {
    document.getElementById(
        "tasksListSection"
    ).hidden = true;

    document.getElementById(
        "taskDetailsPanel"
    ).hidden = true;

    document.getElementById(
        "taskEditPanel"
    ).hidden = true;

    document.getElementById(
        "taskFormPanel"
    ).hidden = false;
}


const newTaskButton =
    document.getElementById("newTaskButton");

const mobileNewTaskButton =
    document.getElementById("mobileNewTaskButton");

if (newTaskButton) {
    newTaskButton.addEventListener(
        "click",
        openTaskForm
    );
}

if (mobileNewTaskButton) {
    mobileNewTaskButton.addEventListener(
        "click",
        openTaskForm
    );
}


const taskForm =
    document.getElementById("taskForm");

if (taskForm) {
    taskForm.addEventListener(
        "submit",
        async event => {
            event.preventDefault();

            const task = {
                title:
                    document.getElementById(
                        "taskTitle"
                    ).value.trim(),

                project_id:
                    document.getElementById(
                        "taskProject"
                    ).value || null,

                description:
                    document.getElementById(
                        "taskDescription"
                    ).value.trim(),

                status:
                    document.getElementById(
                        "taskStatus"
                    ).value,

                deadline:
                    document.getElementById(
                        "taskDeadline"
                    ).value || null
            };

            try {
                await apiRequest("/tasks", {
                    method: "POST",
                    body: JSON.stringify(task)
                });

                taskForm.reset();

                await loadData();

                document.getElementById(
                    "taskFormPanel"
                ).hidden = true;

                document.getElementById(
                    "tasksListSection"
                ).hidden = false;

            } catch (error) {
                console.error(
                    "Could not save task:",
                    error
                );
            }
        }
    );
}


/* ========================================
   Task Back
======================================== */

const backToTasksButton =
    document.getElementById(
        "backToTasksButton"
    );

if (backToTasksButton) {
    backToTasksButton.addEventListener(
        "click",
        () => {

            document.getElementById(
                "taskDetailsPanel"
            ).hidden = true;

            document.getElementById(
                "taskEditPanel"
            ).hidden = true;

            document.getElementById(
                "taskFormPanel"
            ).hidden = true;

            document.getElementById(
                "tasksListSection"
            ).hidden = false;
        }
    );
}


/* ========================================
   Task Edit
======================================== */

const editTaskButton =
    document.getElementById(
        "editTaskButton"
    );

if (editTaskButton) {
    editTaskButton.addEventListener(
        "click",
        () => {

            if (!selectedTask) {
                return;
            }

            document.getElementById(
                "taskDetailsPanel"
            ).hidden = true;

            document.getElementById(
                "taskEditPanel"
            ).hidden = false;

            document.getElementById(
                "editTaskId"
            ).value = selectedTask.id;

            document.getElementById(
                "editTaskTitle"
            ).value = selectedTask.title || "";

            document.getElementById(
                "editTaskProject"
            ).value =
                selectedTask.project_id || "";

            document.getElementById(
                "editTaskDescription"
            ).value =
                selectedTask.description || "";

            document.getElementById(
                "editTaskStatus"
            ).value =
                selectedTask.status || "pending";

            document.getElementById(
                "editTaskDeadline"
            ).value =
                selectedTask.deadline || "";
        }
    );
}


const taskEditForm =
    document.getElementById(
        "taskEditForm"
    );

if (taskEditForm) {
    taskEditForm.addEventListener(
        "submit",
        async event => {
            event.preventDefault();

            const id =
                document.getElementById(
                    "editTaskId"
                ).value;

            const task = {
                title:
                    document.getElementById(
                        "editTaskTitle"
                    ).value.trim(),

                project_id:
                    document.getElementById(
                        "editTaskProject"
                    ).value || null,

                description:
                    document.getElementById(
                        "editTaskDescription"
                    ).value.trim(),

                status:
                    document.getElementById(
                        "editTaskStatus"
                    ).value,

                deadline:
                    document.getElementById(
                        "editTaskDeadline"
                    ).value || null
            };

            try {
                await apiRequest(`/tasks/${id}`, {
                    method: "PUT",
                    body: JSON.stringify(task)
                });

                await loadData();

                const updated =
                    tasks.find(
                        item =>
                            Number(item.id) ===
                            Number(id)
                    );

                if (updated) {
                    showTaskDetails(updated);
                }

            } catch (error) {
                console.error(
                    "Could not update task:",
                    error
                );
            }
        }
    );
}


const cancelEditTaskButton =
    document.getElementById(
        "cancelEditTaskButton"
    );

if (cancelEditTaskButton) {
    cancelEditTaskButton.addEventListener(
        "click",
        () => {

            if (selectedTask) {
                showTaskDetails(selectedTask);
            }
        }
    );
}


/* ========================================
   Task Projects
======================================== */

function populateTaskProjects() {
    const selects = [
        document.getElementById("taskProject"),
        document.getElementById("editTaskProject")
    ];

    selects.forEach(select => {

        if (!select) {
            return;
        }

        const currentValue = select.value;

        select.innerHTML = `
            <option value="">No project</option>
        `;

        projects.forEach(project => {

            const option =
                document.createElement("option");

            option.value = project.id;
            option.textContent = project.name;

            select.appendChild(option);
        });

        if (currentValue) {
            select.value = currentValue;
        }
    });
}


/* ========================================
   Settings / Account
======================================== */

async function loadAccount() {
    try {
        const account =
            await apiRequest("/account");

        const name =
            document.getElementById("accountName");

        const email =
            document.getElementById("accountEmail");

        if (name) {
            name.value = account.full_name || "";
        }

        if (email) {
            email.value = account.email || "";
        }

    } catch (error) {
        console.error(
            "Could not load account:",
            error
        );
    }
}


const accountForm =
    document.getElementById("accountForm");

if (accountForm) {
    accountForm.addEventListener(
        "submit",
        async event => {
            event.preventDefault();

            const account = {
                full_name:
                    document.getElementById(
                        "accountName"
                    ).value.trim(),

                email:
                    document.getElementById(
                        "accountEmail"
                    ).value.trim()
            };

            try {
                await apiRequest("/account", {
                    method: "POST",
                    body: JSON.stringify(account)
                });

                alert("Account saved.");

            } catch (error) {
                console.error(
                    "Could not save account:",
                    error
                );
            }
        }
    );
}


/* ========================================
   Export
======================================== */

const exportDataButton =
    document.getElementById(
        "exportDataButton"
    );

if (exportDataButton) {
    exportDataButton.addEventListener(
        "click",
        async () => {

            try {
                const data =
                    await apiRequest("/export");

                const file =
                    new Blob(
                        [JSON.stringify(data, null, 2)],
                        {
                            type: "application/json"
                        }
                    );

                const url =
                    URL.createObjectURL(file);

                const link =
                    document.createElement("a");

                link.href = url;
                link.download = "dofsky-data.json";

                link.click();

                URL.revokeObjectURL(url);

            } catch (error) {
                console.error(
                    "Could not export data:",
                    error
                );
            }
        }
    );
}


/* ========================================
   Clear Data
======================================== */

const clearDataButton =
    document.getElementById(
        "clearDataButton"
    );

if (clearDataButton) {
    clearDataButton.addEventListener(
        "click",
        async () => {

            const confirmed =
                confirm(
                    "Clear all DOFSKY data?"
                );

            if (!confirmed) {
                return;
            }

            try {

                await apiRequest("/data", {
                    method: "DELETE"
                });


                alert("Data cleared.");


                await loadData();


                /*
                 * If Clear Data is used from Settings,
                 * refresh the visible account profile too.
                 */

                if (
                    window.location.pathname.endsWith(
                        "settings.html"
                    ) &&
                    typeof loadSettingsProfile === "function"
                ) {
                    await loadSettingsProfile();
                }

            } catch (error) {

                console.error(
                    "Could not clear data:",
                    error
                );

            }
        }
    );
}


/* ========================================
   Basic HTML Safety
======================================== */

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* ========================================
   Start DOFSKY
======================================== */

loadData();