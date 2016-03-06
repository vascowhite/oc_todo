<ul ng-repeat="project in todoList.todolistProject">
    <li>
        <h3 class="h3">{{project.name}}</h3>
    </li>
    <ul class="list-group">
        <todo-item ng-repeat="todo in project.todos | filter:todoCtrl.tdFilter"></todo-item>
    </ul>
</ul>
<todo-add-new></todo-add-new>