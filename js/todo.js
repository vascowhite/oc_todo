var Todo = Todo || {};

(function(window, $, exports, undefined){
    'use strict';
    var todoArray = [];
    var options = {};

    var clone = function(object){
        return JSON.parse(JSON.stringify(object));
    };

    var renderToDo = function(todoList, targetId){
        if(!targetId){targetId = 'todo-todoList'}
        removeChildElements(document.getElementById(targetId));
        var todoCount = todoList.length;
        for(var i = 0; i < todoCount; i ++){
            var todo = todoList[i];
            var classList = 'todo-item';
            var li = document.createElement('li');
            li.innerText = todo.todo;
            if(todo.overdue && options.hiliteOverdue === 'true' && !todo.completed){
                classList += ' todo-overdue';
            }
            if(todo.completed){
                classList += ' todo-done';
            }
            li.className = classList;
            li.addEventListener('dblclick', function(e){
                editTodo(this.firstChild.id.split('_')[1]);
            });
            var checkBox = document.createElement('input');
            checkBox.type = 'checkbox';
            checkBox.id = 'todo_' + i;
            checkBox.addEventListener('change', function(){
                toggleComplete(this.id.split('_')[1]);
            });
            li.insertBefore(checkBox, li.firstChild);
            document.getElementById(targetId).appendChild(li);
        }
        var newTodo = document.createElement('input');
        newTodo.type = 'text';
        newTodo.placeholder = 'New Todo';
        newTodo.id = 'todo-add-new';
        newTodo.className = 'todo-edit';
        newTodo.addEventListener('keypress', function(e){
            if(e.charCode === 13){
                addNew(this.value);
            }
        });
        document.getElementById(targetId).appendChild(newTodo);


        var archiveBtn = document.getElementById('todo-archive');
        if(!archiveBtn){
            archiveBtn = document.createElement('button');
            archiveBtn.id = 'todo-archive';
            archiveBtn.textContent = 'Archive';
            archiveBtn.addEventListener('click', function(){
                Todo.archive();
            });
            document.getElementById('todo-todoList').parentNode.appendChild(archiveBtn);
        }
    };

    var renderByContexts = function(todoList){
        var sorted = clone(todoList);
        var contexts = {};
        var todoCount = sorted.length;
        for(var i = 0; i < todoCount; i ++){
            var todo = sorted[i];
            var contextCount = todo.contexts.length;
            for(var j = 0; j < contextCount; j ++){
                var context = todo.contexts[j];
                if(context in contexts) {
                    contexts[context].push(todo.todo);
                } else {
                    contexts[context] = [todo.todo];
                }
            }
        }

    };

    var renderByProjects = function(todoList){

    };

    var renderProjects = function(projectsList){
        removeChildElements(document.getElementById('todo-filter-projects'));
        var projectCount = projectsList.length;

        for(var i = 0; i < projectCount; i ++){
            var project = projectsList[i];
            var checkBox = document.createElement('input');
            checkBox.type = 'checkbox';
            checkBox.id = project;
            checkBox.checked = true;

            var label = document.createElement('label');
            label.htmlFor = project;
            label.innerText = project;

            label.appendChild(checkBox);
            document.getElementById('todo-filter-projects').appendChild(label);
        }
    };

    var renderContexts = function(contextsList){
        removeChildElements(document.getElementById('todo-filter-contexts'));
        var contextCount = contextsList.length;

        for(var i = 0; i < contextCount; i ++){
            var context = contextsList[i];
            var checkBox = document.createElement('input');
            checkBox.type = 'checkbox';
            checkBox.id = context;

            var label = document.createElement('label');
            label.htmlFor = context;
            label.innerText = context;
            checkBox.checked = true;

            label.appendChild(checkBox);
            document.getElementById('todo-filter-contexts').appendChild(label);
        }
    };

    var removeChildElements = function(parentEl){
        while(parentEl.firstChild){
            parentEl.removeChild(parentEl.firstChild);
        }
    };

    var sortByPriority = function(arrayToSort){
        arrayToSort.sort(function(a, b){
            if(!a.priority && !b.priority){
                return 0;
            }
            if(a.priority && !b.priority){
                return -1;
            }
            if(!a.priority && b.priority){
                return 1;
            }
            return a.priority.localeCompare(b.priority);
        })
        return arrayToSort;
    };

    var render = function(data){
        todoArray = data.todos;
        options = data.options;
        renderToDo(todoArray);
        renderContexts(data.contexts);
        renderProjects(data.projects);
        if(options.hiliteOverdue === 'true'){
            $('#todoHiLiteOverdue').prop('checked', true);
        }
    };

    var getAll = function(){
        var url = exports.baseUrl + '/get';
        $.ajax({
            url: url,
            method: 'GET'
        }).done(function(data){
            render(data);
        });
    };

    var addNew = function(newTodo){
        var url = exports.baseUrl + '/add';
        $.ajax({
            url: url,
            method: 'PUT',
            data: {todoText: btoa(newTodo)}
        }).done(function(data){
            render(data);
            document.getElementById('todo-add-new').value = '';
        });
    };

    var toggleComplete = function(todoNum){
        if(!todoArray[todoNum].completed){
            $.ajax({
                url: exports.baseUrl + '/do',
                method: 'POST',
                data: {todoNum: todoNum}
            }).done(function(data){
                todoArray[todoNum] = data;
                renderToDo(todoArray);
                if(options.autoArchive === 'true'){
                    Todo.archive();
                }
            }).always(function(){
                exports.init();
            });
        } else {
            $.ajax({
                url: exports.baseUrl + '/undo',
                method: 'POST',
                data: {todoNum: todoNum}
            }).done(function(data){
                todoArray[todoNum] = data;
                renderToDo(todoArray);
            }).always(function(){
                exports.init();
            });
        }
    };

    var editTodo = function(todoNum){
        var old = todoArray[todoNum].todo;
        var targetLi = document.getElementById('todo_' + todoNum).parentNode;
        removeChildElements(targetLi);
        var input = document.createElement('input');
        input.type = 'text';
        input.id = 'todo-edit';
        input.className = 'todo-edit';
        input.value = old;
        input.addEventListener('keypress', function(e){
            if(e.charCode === 13){
                processEdit(old, input.value);
            }
        });
        input.addEventListener('blur', function(){
            processEdit('', '');
        });
        targetLi.appendChild(input);
        input.focus();
    };

    var processEdit = function(oldText, newText){
        if(oldText !== newText){
            $.ajax({
                url: exports.baseUrl + '/update',
                method: 'PUT',
                data: {oldText: btoa(oldText), newText: btoa(newText)}
            }).done(function(data){
                render(data);
            }).fail(function(data){
                console.log(data);
            });
        } else {
            getAll();
        }
    };

    exports.archive = function(){
        $.ajax({
            url: exports.baseUrl + '/archive',
            method: 'GET'
        }).done(function(data){
            console.log('Archived ' + data[0] + ' items.');
            getAll();
        });
    };

    exports.baseUrl = OC.generateUrl('/apps/todo');

    exports.sortBy = function(filter){
        filter = filter.trim();
        switch(filter){
            case 'File':
                renderToDo(todoArray);
                break;
            case 'Alphabetical':
                var sorted = clone(todoArray);
                renderToDo(sorted.sort(function(a, b){
                    return a.text.localeCompare(b.text);
                }));
                break;
            case 'Priority':
                var sorted = clone(todoArray);
                renderToDo(sortByPriority(sorted));
                break;
            case 'Context':
                renderByContexts(todoArray);
                break;
            case 'Project':
                renderByProjects(todoArray);
                break;
            case 'Date Created':
                var sorted = clone(todoArray);
                renderToDo(sorted.sort(function(a, b){
                    if(!a.created && !b.created){
                        return 0;
                    }
                    if(a.created && !b.created){
                        return -1;
                    }
                    if(!a.creaed && b.created){
                        return 1;
                    }
                    return a.created.localeCompare(b.created);
                }));
                break;
            case 'Due Date':
                var sorted = clone(todoArray);
                renderToDo(sorted.sort(function(a, b){
                    if(!a.due && !b.due){
                        return 0;
                    }
                    if(a.due && !b.due){
                        return -1;
                    }
                    if(!a.due && b.due){
                        return 1;
                    }
                    return a.due.localeCompare(b.due);
                }));
                break;
            default:
                renderToDo(todoArray);
                break;
        }
    };

    exports.setOption = function(todoOption, todoValue){
        //base64 encode options to avoid issues with paths and url's
        options[todoOption] = todoValue;
        var encoded = btoa(todoValue);
        $.ajax({
            url: exports.baseUrl + '/option/' + todoOption + '/' + encoded,
            method: 'GET'
        }).done(function(data){
            options = data;
            renderToDo(todoArray);
        });
    };

    exports.getOption = function(optionName){
        return options[optionName];
    };

    exports.init = function(){
        getAll();
    };
})(window, jQuery, Todo);


$(document).ready(function(){
    Todo.init();
    $('.todo-sort li').on('click', function(e){Todo.sortBy(e.currentTarget.innerText);});
    $('#todoHiLiteOverdue').on('change', function(){
        Todo.setOption('hiliteOverdue', $('#todoHiLiteOverdue').prop('checked'));
    });
    $('#todoPath').on('change', function(){
        Todo.setOption('todoPath', $('#todoPath').val());
    });
    $('#donePath').on('change', function(){
        Todo.setOption('donePath', $('#donePath').val());
    });
    $('#todoAutoArchive').on('change', function(){
        Todo.setOption('autoArchive', $('#todoAutoArchive').prop('checked'));
        if(Todo.getOption('autoArchive') === 'true'){
            Todo.archive();
        }
    });
});