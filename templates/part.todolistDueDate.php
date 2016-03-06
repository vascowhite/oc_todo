<ul class="list-group">
    <todo-item ng-repeat="todo in todoList.todolistDueDate | filter:todoCtrl.tdFilter"></todo-item>
</ul>
<todo-add-new></todo-add-new>