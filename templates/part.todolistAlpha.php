<ul class="list-group">
    <todo-item ng-repeat="todo in todoList.todolistAlpha | filter:todoCtrl.tdFilter"></todo-item>
</ul>
<todo-add-new></todo-add-new>