<ul ng-repeat="context in todoList.todolistContext">
    <li>
        <h3 class="h3">{{context.name}}</h3>
    </li>
    <ul class="list-group">
        <todo-item ng-repeat="todo in context.todos | filter:todoCtrl.tdFilter"></todo-item>
    </ul>
</ul>
<todo-add-new></todo-add-new>