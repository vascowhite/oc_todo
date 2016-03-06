<ul class="list-group">
    <todo-item ng-repeat="todo in todoList.todolistPriority | filter:todoCtrl.tdFilter"></todo-item>
</ul>
<todo-add-new></todo-add-new>