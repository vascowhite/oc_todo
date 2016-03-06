<li
    class="list-group-item"
    ng-class="{todo_done: todo.completed, todo_overdue: todo.overdue}"
>
    <div ng-hide="editCtrl.showEdit">
        <span>
            <input
                type="checkbox"
                ng-checked="todo.completed"
                ng-click="todoItemCtrl.doTodo(todo.todoNum)"
            >
        </span>
        <span>
            <strong>({{todo.todoNum + 1}})</strong>
        </span>
        <span ng-hide="editCtrl.showEdit">
            {{todo.todo}}
            <span class="todoactions">
                <a
                    class="action"
                    ng-show="todo.completed"
                    ng-click="todoItemCtrl.archive(todo.todoNum)"
                    title="Archive"
                >
                    <img class="svg" src="/apps/todo/img/archive.png">
                </a>
                <a class="action" ng-click="editCtrl.showEdit = true" title="Edit">
                    <img class="svg" src="/core/img/actions/rename.svg">
                </a>
            </span>
        </span>
    </div>
    <div ng-show="editCtrl.showEdit">
        <todo-edit-item ng-show="editCtrl.showEdit"></todo-edit-item>
    </div>
</li>