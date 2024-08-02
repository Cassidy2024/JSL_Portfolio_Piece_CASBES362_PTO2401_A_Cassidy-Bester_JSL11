import {
  createNewTask,
  deleteTask,
  getTasks,
  patchTask
} from "./utils/taskFunctions.js";

import {
  initialData
} from "./initialData.js";

// Function checks if local storage already has data, if not it loads initialData to localStorage
function initializeData() {
  try {
    if (!localStorage.getItem('tasks')) {
      localStorage.setItem('tasks', JSON.stringify(initialData));
      localStorage.setItem('showSideBar', 'true');
      console.log('Initial data loaded into localStorage');
    } else {
      console.log('Tasks data already exists in localStorage');
    }
  } catch (error) {
    console.error('Error initializing data:', error);
  }
}

// Get elements from the DOM
const elements = {
  headerBoardName: document.getElementById('header-board-name'),
  filterDiv: document.getElementById("filterDiv"),
  columnDivs: document.querySelectorAll(".column-div"),
  hideSideBarBtn: document.getElementById("hide-side-bar-btn"),
  showSideBarBtn: document.getElementById("show-side-bar-btn"),
  themeSwitch: document.getElementById("switch"),
  modalWindow: document.getElementById("new-task-modal-window"),
  editTaskModal: document.querySelector(".edit-task-modal-window"),
  addNewTaskBtn: document.getElementById('add-new-task-btn'),
  
};

let activeBoard = "";

// Extracts unique board names from tasks and displays them
function fetchAndDisplayBoardsAndTasks() {
  const tasks = getTasks();
  const boards = [...new Set(tasks.map(task => task.board).filter(Boolean))];
  displayBoards(boards);

  if (boards.length > 0) {
    const localStorageBoard = JSON.parse (localStorage.getItem("activeBoard"));
    activeBoard = localStorageBoard  ? localStorageBoard  : boards[0];
    elements.headerBoardName.textContent = activeBoard;
    styleActiveBoard(activeBoard);
    refreshTasksUI();
  }
}

// Creates different boards in the DOM
function displayBoards(boards) {
  const boardsContainer = document.getElementById("boards-nav-links-div");
  boardsContainer.innerHTML = ''; // Clears the container
  boards.forEach(board => {
    const boardElement = document.createElement("button");
    boardElement.textContent = board;
    boardElement.classList.add("board-btn");

    boardElement.addEventListener('click', () => {
      elements.headerBoardName.textContent = board;
      filterAndDisplayTasksByBoard(board);
      activeBoard = board; // Assigns active board
      localStorage.setItem("activeBoard", JSON.stringify(activeBoard));
      styleActiveBoard(activeBoard);
    });

    boardsContainer.appendChild(boardElement);
  });
}

// Filters tasks corresponding to the board name and displays them on the DOM.
function filterAndDisplayTasksByBoard(boardName) {
  const tasks = getTasks(); // Fetch tasks from a simulated local storage function
  const filteredTasks = tasks.filter(task => task.board === boardName);

  elements.columnDivs.forEach(column => {
    const status = column.getAttribute("data-status");
    // Reset column content while preserving the column title
    column.innerHTML = `
      <div class="column-head-div">
        <span class="dot" id="${status}-dot"></span>
        <h4 class="columnHeader">${status.toUpperCase()}</h4>
      </div>
    `;

    const tasksContainer = document.createElement("div");
    tasksContainer.classList.add('tasks-container');
    column.appendChild(tasksContainer);

    filteredTasks.filter(task => task.status === status).forEach(task => {
      const taskElement = document.createElement("div");
      taskElement.classList.add("task-div");
      taskElement.textContent = task.title;
      taskElement.setAttribute('data-task-id', task.id);

      // Listen for a click event on each task and open a modal
      taskElement.addEventListener('click', () => {
        openEditTaskModal(task);
      });

      tasksContainer.appendChild(taskElement);
    });
  });
}

function refreshTasksUI() {
  filterAndDisplayTasksByBoard(activeBoard);
}

// Styles the active board by adding an active class
function styleActiveBoard(boardName) {
  document.querySelectorAll('.board-btn').forEach(btn => {
    if (btn.textContent === boardName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function addTaskToUI(task) {
  const column = document.querySelector(`.column-div[data-status="${task.status}"]`);
  if (!column) {
    console.error(`Column not found for status: ${task.status}`);
    return;
  }
  
  let tasksContainer = column.querySelector('.tasks-container');
  if (!tasksContainer) {
    console.warn(`Tasks container not found for status: ${task.status}, creating one.`);
    tasksContainer = document.createElement('div');
    tasksContainer.className = 'tasks-container';
    column.appendChild(tasksContainer);
  }
  
  const taskElement = document.createElement('div');
  taskElement.className = 'task-div';
  taskElement.textContent = task.title; 
  taskElement.setAttribute('data-task-id', task.id);
  
  tasksContainer.appendChild(taskElement); // Append the taskElement
}

function setupEventListeners() {
  // Cancel editing task event listener
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', () => toggleModal(false, elements.editTaskModal));
  }

  // Cancel adding new task event listener
  const cancelAddTaskBtn = document.getElementById('cancel-add-task-btn');
  if (cancelAddTaskBtn) {
    cancelAddTaskBtn.addEventListener('click', () => {
      toggleModal(false);
      elements.filterDiv.style.display = 'none'; // Also hide the filter overlay
    });
  }

  // Clicking outside the modal to close it
  if (elements.filterDiv) {
    elements.filterDiv.addEventListener('click', () => {
      toggleModal(false);
      elements.filterDiv.style.display = 'none';
    });
  }

  // Show sidebar event listener
  if (elements.hideSideBarBtn) {
    elements.hideSideBarBtn.addEventListener('click', () => toggleSidebar(false));
  }
  if (elements.showSideBarBtn) {
    elements.showSideBarBtn.addEventListener('click', () => toggleSidebar(true));
  }

  // Theme switch event listener
  if (elements.themeSwitch) {
    elements.themeSwitch.addEventListener('change', toggleTheme);
  }

  // Show Add New Task Modal event listener
  if (elements.addNewTaskBtn) {
    elements.addNewTaskBtn.addEventListener('click', () => {
      toggleModal(true);
      elements.filterDiv.style.display = 'block'; 
    });
  }

  // Add new task form submission event listener
  if (elements.modalWindow) {
    elements.modalWindow.addEventListener('submit', (event) => {
      addTask(event);
    });
  }
}

// Toggles tasks modal
function toggleModal(show, modal = elements.modalWindow) {
  if (modal) {
    modal.style.display = show ? 'block' : 'none';
  }
}

function addTask(event) {
  event.preventDefault();
  

  // Assign user input to the task object
  const task = {
    id: Date.now(), 
    title: document.getElementById('title-input').value,
    description: document.getElementById('desc-input').value,
    status: document.getElementById('edit-status-select').value, 
    board: activeBoard
  };

  const newTask = createNewTask(task);
  if (newTask) {
    addTaskToUI(newTask);
    toggleModal(false);
    elements.filterDiv.style.display = 'none'; 
    event.target.reset();
    refreshTasksUI();
    
  }
}



// Function to toggle sidebar visibility
function toggleSidebar(show) {
  const sideBar = document.getElementById('side-bar-div');
  const showSideBarBtn = document.getElementById('show-side-bar-btn');
  const hideSideBarBtn = document.getElementById('hide-side-bar-btn');

  if (!sideBar || !showSideBarBtn || !hideSideBarBtn) {
    console.error('Sidebar elements not found');
    return;
  }

  sideBar.style.display = show ? 'block' : 'none';
  showSideBarBtn.style.display = show ? 'none' : 'block';
  hideSideBarBtn.style.display = show ? 'flex' : 'none';

  localStorage.setItem('showSideBar', show ? 'true' : 'false');
}

// Function to initialize sidebar based on localStorage
function initializeSidebar() {
  const showSideBar = localStorage.getItem('showSideBar') === 'true';
  toggleSidebar(showSideBar);
}

window.addEventListener('load', initializeSidebar);

function toggleTheme() {
  document.body.classList.toggle('light-theme');
  const isLightTheme = document.body.classList.contains('light-theme');
  localStorage.setItem('light-theme', isLightTheme ? 'enabled' : 'disabled');
}

function openEditTaskModal(task) {
  document.getElementById('edit-task-title-input').value = task.title;
  document.getElementById('edit-task-desc-input').value = task.description;
  document.getElementById('edit-select-status').value = task.status;

  document.getElementById('save-changes-btn').onclick = () => saveTaskChanges(task.id);
  document.getElementById('delete-task-btn').onclick = () => {
    deleteTask(task.id);
    toggleModal(false, elements.editTaskModal);
    refreshTasksUI();
  };

  toggleModal(true, elements.editTaskModal); // Show the edit task modal
}

function saveTaskChanges(taskId) {
  const updatedTask = {
    title: document.getElementById('edit-task-title-input').value,
    description: document.getElementById('edit-task-desc-input').value,
    status: document.getElementById('edit-select-status').value,
    board: activeBoard
  };

  patchTask(taskId, updatedTask);

  toggleModal(false, elements.editTaskModal);
  refreshTasksUI();
}

document.addEventListener('DOMContentLoaded', function() {
  init(); // init is called after the DOM is fully loaded
});

function init() {
  initializeData();
  setupEventListeners();
  const showSidebar = localStorage.getItem('showSideBar') === 'true';
  toggleSidebar(showSidebar);
  const isLightTheme = localStorage.getItem('light-theme') === 'enabled';
  document.body.classList.toggle('light-theme', isLightTheme);
  fetchAndDisplayBoardsAndTasks(); // Initial display of boards and tasks
}
