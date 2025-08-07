import { getPencilIcon, getTrashIcon } from './icons.js';

const STORAGE_KEY = 'todo-items-v1';

/**
 * @typedef {Object} TodoItem
 * @property {string} id
 * @property {string} title
 * @property {boolean} completed
 * @property {number} createdAt
 */

/**
 * Application state
 */
const state = {
  /** @type {TodoItem[]} */
  items: [],
  /** @type {'all'|'active'|'completed'} */
  filter: 'all',
};

/** DOM Elements */
const formElement = document.getElementById('new-todo-form');
const inputElement = document.getElementById('new-todo-input');
const listElement = document.getElementById('todo-list');
const itemsLeftElement = document.getElementById('items-left');
const clearCompletedButton = document.getElementById('clear-completed');
const filterButtons = Array.from(document.querySelectorAll('.filter'));

function loadStateFromStorage() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (Array.isArray(parsed)) {
      state.items = parsed.filter(Boolean);
    }
  } catch { /* ignore */ }
}

function saveStateToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
}

function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function addTodo(title) {
  const trimmed = title.trim();
  if (!trimmed) return;
  const newItem = {
    id: generateId(),
    title: trimmed,
    completed: false,
    createdAt: Date.now(),
  };
  state.items.unshift(newItem);
  saveStateToStorage();
  render();
}

function toggleTodoCompletion(id) {
  const item = state.items.find(t => t.id === id);
  if (!item) return;
  item.completed = !item.completed;
  saveStateToStorage();
  render();
}

function deleteTodo(id) {
  state.items = state.items.filter(t => t.id !== id);
  saveStateToStorage();
  render();
}

function updateTodoTitle(id, newTitle) {
  const item = state.items.find(t => t.id === id);
  if (!item) return;
  const trimmed = newTitle.trim();
  if (trimmed.length === 0) {
    deleteTodo(id);
    return;
  }
  item.title = trimmed;
  saveStateToStorage();
  render();
}

function setFilter(filter) {
  state.filter = filter;
  for (const btn of filterButtons) {
    const isActive = btn.dataset.filter === filter;
    btn.classList.toggle('is-active', isActive);
    btn.setAttribute('aria-selected', String(isActive));
  }
  render();
}

function getVisibleItems() {
  switch (state.filter) {
    case 'active':
      return state.items.filter(t => !t.completed);
    case 'completed':
      return state.items.filter(t => t.completed);
    default:
      return state.items;
  }
}

function render() {
  const items = getVisibleItems();
  listElement.innerHTML = '';

  for (const item of items) {
    const li = document.createElement('li');
    li.className = 'todo-item';
    li.dataset.id = item.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'todo-checkbox';
    checkbox.checked = item.completed;
    checkbox.setAttribute('aria-label', `Mark ${item.title} as ${item.completed ? 'active' : 'completed'}`);
    checkbox.addEventListener('change', () => toggleTodoCompletion(item.id));

    const title = document.createElement('p');
    title.className = 'todo-title' + (item.completed ? ' completed' : '');
    title.textContent = item.title;
    title.tabIndex = 0;
    title.addEventListener('dblclick', () => enterEditMode(title, item));
    title.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        title.blur();
      }
    });

    const actions = document.createElement('div');
    actions.className = 'todo-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'icon-btn';
    editBtn.innerHTML = getPencilIcon();
    editBtn.setAttribute('aria-label', `Edit ${item.title}`);
    editBtn.addEventListener('click', () => enterEditMode(title, item));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'icon-btn';
    deleteBtn.innerHTML = getTrashIcon();
    deleteBtn.setAttribute('aria-label', `Delete ${item.title}`);
    deleteBtn.addEventListener('click', () => deleteTodo(item.id));

    actions.append(editBtn, deleteBtn);
    li.append(checkbox, title, actions);
    listElement.appendChild(li);
  }

  const remaining = state.items.filter(t => !t.completed).length;
  itemsLeftElement.textContent = String(remaining);
}

function enterEditMode(titleElement, item) {
  if (item.completed) return;
  titleElement.setAttribute('contenteditable', 'true');
  titleElement.focus();
  placeCaretAtEnd(titleElement);

  const original = titleElement.textContent || '';
  const onBlur = () => {
    titleElement.removeEventListener('blur', onBlur);
    titleElement.removeEventListener('keydown', onKeydown);
    titleElement.removeAttribute('contenteditable');
    const updated = titleElement.textContent || '';
    if (updated !== original) updateTodoTitle(item.id, updated);
  };
  const onKeydown = (e) => {
    if (e.key === 'Escape') {
      titleElement.textContent = original;
      titleElement.blur();
    }
  };
  titleElement.addEventListener('blur', onBlur);
  titleElement.addEventListener('keydown', onKeydown);
}

function placeCaretAtEnd(element) {
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

function clearCompleted() {
  state.items = state.items.filter(t => !t.completed);
  saveStateToStorage();
  render();
}

// Event bindings
formElement.addEventListener('submit', (e) => {
  e.preventDefault();
  addTodo(inputElement.value);
  inputElement.value = '';
});

clearCompletedButton.addEventListener('click', clearCompleted);

for (const btn of filterButtons) {
  btn.addEventListener('click', () => setFilter(btn.dataset.filter));
}

// Initialize
loadStateFromStorage();
render();