let renameRules = [];
let imageOrder = 'natural';


// LOCALSTORAGE FUNCTIONS
function saveRenameRulesToLocalStorage() {
  localStorage.setItem('renameRules', JSON.stringify(renameRules));
}

function loadRenameRulesFromLocalStorage() {
  const storedRules = localStorage.getItem('renameRules');
  if (storedRules) {
    renameRules = JSON.parse(storedRules);
    updateRenameRulesList();
  }
}

function saveImageOrderToLocalStorage(order) {
  imageOrder = order;
  localStorage.setItem('imageOrder', imageOrder);
}

function loadImageOrderFromLocalStorage() {
  const storedOrder = localStorage.getItem('imageOrder');
  if (storedOrder) {
    imageOrder = storedOrder;
    document.getElementById('ruleOrderSelect').value = imageOrder;
  }
}

// TABS
function switchRenameTab(tab) {
  document.querySelectorAll('.rename-tab').forEach(tabContent => {
    tabContent.classList.add('hidden');
    tabContent.classList.remove('rename-tab--active');
  });

  document.querySelector(`#renameTab${tab.charAt(0).toUpperCase() + tab.slice(1)}`).classList.remove('hidden');
  document.querySelector(`#renameTab${tab.charAt(0).toUpperCase() + tab.slice(1)}`).classList.add('rename-tab--active');

  document.querySelectorAll('.tab-button').forEach(button => {
    button.classList.remove('tab-button--active');
  });

  document.querySelector(`.tab-button[onclick="switchRenameTab('${tab}')"]`).classList.add('tab-button--active');
}


// RENAME RULES

/* insert rule */
function toggleAfterPositionField(position) {
  const afterPositionField = document.getElementById('afterPositionField');
  if (position === 'afterPosition' || position === 'beforeEnd') {
    afterPositionField.classList.remove('hidden');
  } else {
    afterPositionField.classList.add('hidden');
  }
}

function addInsertRule() {
  const ruleText = document.getElementById('renameRuleText').value.trim();
  const rulePosition = document.getElementById('renameRulePosition').value;
  const insertPosition = parseInt(document.getElementById('renameRuleAfterPosition').value, 10);

  if (!ruleText) {
    alert('Please enter text for the rule.');
    return;
  }

  const rule = { type: 'insert', text: ruleText, position: rulePosition, insertPosition: insertPosition };

  renameRules.push(rule);
  updateRenameRulesList();
  saveRenameRulesToLocalStorage();
}

function applyInsertRule(fileName, rule) {
  if (rule.position === 'prefix') {
    return `${rule.text}${fileName}`;
  } else if (rule.position === 'suffix') {
    const extensionIndex = fileName.lastIndexOf('.');
    if (extensionIndex !== -1) {
      const name = fileName.slice(0, extensionIndex);
      const extension = fileName.slice(extensionIndex);
      return `${name}${rule.text}${extension}`;
    } else {
      return `${fileName}${rule.text}`;
    }
  } else if (rule.position === 'afterPosition') {
    const position = rule.insertPosition;
    if (position >= 0 && position < fileName.length) {
      return `${fileName.slice(0, position)}${rule.text}${fileName.slice(position)}`;
    }
  } else if (rule.position === 'beforeEnd') {
    const extensionIndex = fileName.lastIndexOf('.');
    const name = extensionIndex !== -1 ? fileName.slice(0, extensionIndex) : fileName;
    const extension = extensionIndex !== -1 ? fileName.slice(extensionIndex) : '';
    const position = name.length - rule.insertPosition;

    if (position >= 0 && position <= name.length) {
      return `${name.slice(0, position)}${rule.text}${name.slice(position)}${extension}`;
    }
  }
  return fileName;
}

/* replace rule */
function addReplaceRule() {
  const findText = document.getElementById('replaceRuleFind').value.trim();
  const replaceText = document.getElementById('replaceRuleReplace').value.trim();

  if (!findText) {
    alert('Please enter text to find.');
    return;
  }

  renameRules.push({ type: 'replace', find: findText, replace: replaceText });
  updateRenameRulesList();
  saveRenameRulesToLocalStorage();
}

function applyReplaceRule(fileName, rule) {
  const regex = new RegExp(rule.find, 'g');
  return fileName.replace(regex, rule.replace);
}

/* serialize rules */
function addSerializeRule() {
  const startNumber = parseInt(document.getElementById('serializeStartNumber').value, 10);
  const increment = parseInt(document.getElementById('serializeIncrement').value, 10);
  const digits = parseInt(document.getElementById('serializeDigits').value, 10);

  if (isNaN(startNumber) || isNaN(increment) || isNaN(digits)) {
    alert('Please enter valid numbers for all fields.');
    return;
  }

  renameRules.push({ type: 'serialize', startNumber, increment, digits });
  updateRenameRulesList();
  saveRenameRulesToLocalStorage();
}

function applySerializeRule(fileName, rule, positionInList) {
  const number = rule.startNumber + positionInList * rule.increment;
  const paddedNumber = String(number).padStart(rule.digits, '0');
  const extensionIndex = fileName.lastIndexOf('.');
  const name = extensionIndex !== -1 ? fileName.slice(0, extensionIndex) : fileName;
  const extension = extensionIndex !== -1 ? fileName.slice(extensionIndex) : '';
  return `${paddedNumber}_${name}${extension}`;
}

/* delete rules */
function addDeleteRule() {
  const deleteText = document.getElementById('deleteRuleText').value.trim();
  const startPosition = document.getElementById('deleteRuleStart').value.trim();
  const endPosition = document.getElementById('deleteRuleEnd').value.trim();

  if ((deleteText && (startPosition || endPosition)) || (!deleteText && (!startPosition && !endPosition))) {
    alert('Please specify either a text or a range to delete.');
    return;
  }

  const rule = { type: 'delete' };

  if (deleteText) {
    rule.text = deleteText;
  }

  if (startPosition) {
    rule.start = parseInt(startPosition, 10);
  }

  if (endPosition) {
    rule.end = parseInt(endPosition, 10);
  }

  renameRules.push(rule);
  updateRenameRulesList();
  saveRenameRulesToLocalStorage();
}

function applyDeleteRule(fileName, rule) {
  if (rule.text) {
    const regex = new RegExp(rule.text, 'g');
    return fileName.replace(regex, '');
  }

  const extensionIndex = fileName.lastIndexOf('.');
  const name = extensionIndex !== -1 ? fileName.slice(0, extensionIndex) : fileName;
  const extension = extensionIndex !== -1 ? fileName.slice(extensionIndex) : '';

  const start = rule.start !== undefined ? rule.start : 0;
  const end = rule.end !== undefined ? rule.end : name.length;

  if (start >= 0 && end >= start && start <= name.length) {
    const updatedName = `${name.slice(0, start)}${name.slice(end)}`;
    return `${updatedName}${extension}`;
  }

  return fileName;
}

// RENAME RULES MANAGEMENT
function updateRenameRulesList() {
  const rulesList = document.getElementById('renameRulesList');
  const rulesOverview = document.querySelector('.rename-rules-overview');
  
  if (renameRules.length === 0) {
    rulesOverview.classList.add('hidden');
    return;
  } else {
    rulesOverview.classList.remove('hidden');
  }

  rulesList.innerHTML = '';

  renameRules.forEach((rule, index) => {
    let ruleType = '';
    let ruleDescription = '';
    if (rule.type === 'insert') {
      if (rule.position === 'prefix') {
        ruleType = 'INSERT PREFIX';
        ruleDescription = rule.text;
      } else if (rule.position === 'suffix') {
        ruleType = 'INSERT SUFFIX';
        ruleDescription = rule.text;
      } else if (rule.position === 'afterPosition') {
        ruleType = 'INSERT AFTER';
        ruleDescription = `insert "${rule.text}" after position ${rule.insertPosition}`;
      } else if (rule.position === 'beforeEnd') {
        ruleType = 'INSERT BEFORE';
        ruleDescription = `insert "${rule.text}" from end position ${rule.insertPosition}`;
      }
    } else if (rule.type === 'replace') {
      ruleType = 'REPLACE';
      ruleDescription = `"${rule.find}" with "${rule.replace}"`;
    } else if (rule.type === 'serialize') {
      ruleType = 'SERIALIZE';
      ruleDescription = `start with "${rule.startNumber}" with "${rule.increment}" increments using "${rule.digits}" digits`;
    } else if (rule.type === 'delete') {
      if (rule.text) {
        ruleType = 'DELETE TEXT';
        ruleDescription = rule.text;
      } else {
        const start = rule.start !== undefined ? rule.start : 'start';
        const end = rule.end !== undefined ? rule.end : 'end';
        ruleType = 'DELETE SELECTION';
        ruleDescription = `delete from ${start} to ${end}`;
      }
    }

    const listItem = document.createElement('li');
    listItem.innerHTML = `
      <span class="ruleType">${ruleType}</span> <span class="ruleDescription">${ruleDescription}</span>
      <div class="rule-actions">
        <button class="move-up-button" onclick="moveRenameRuleUp(${index})">↑</button>
        <button class="move-down-button" onclick="moveRenameRuleDown(${index})">↓</button>
        <button class="remove-rule-button" onclick="removeRenameRule(${index})">Remove</button>
      </div>
    `;
    rulesList.appendChild(listItem);
  });
}

function moveRenameRuleUp(index) {
  if (index > 0) {
    const temp = renameRules[index];
    renameRules[index] = renameRules[index - 1];
    renameRules[index - 1] = temp;
    updateRenameRulesList();
    saveRenameRulesToLocalStorage();
  }
}

function moveRenameRuleDown(index) {
  if (index < renameRules.length - 1) {
    const temp = renameRules[index];
    renameRules[index] = renameRules[index + 1];
    renameRules[index + 1] = temp;
    updateRenameRulesList();
    saveRenameRulesToLocalStorage();
  }
}

function removeRenameRule(index) {
  renameRules.splice(index, 1);
  updateRenameRulesList();
  saveRenameRulesToLocalStorage();
}


// APPLY RENAME RULES
function applyRenameRules(fileName, positionInList) {
  let newFileName = fileName;

  renameRules.forEach(rule => {
    switch (rule.type) {
      case 'insert':
        newFileName = applyInsertRule(newFileName, rule);
        break;
      case 'replace':
        newFileName = applyReplaceRule(newFileName, rule);
        break;
      case 'serialize':
        newFileName = applySerializeRule(newFileName, rule, positionInList);
        break;
      case 'delete':
        newFileName = applyDeleteRule(newFileName, rule);
        break;
      default:
        console.warn(`Unknown rule type: ${rule.type}`);
    }
  });

  return newFileName;
}

document.addEventListener('DOMContentLoaded', () => {
  loadRenameRulesFromLocalStorage();
  loadImageOrderFromLocalStorage();
  updateRenameRulesList();
});