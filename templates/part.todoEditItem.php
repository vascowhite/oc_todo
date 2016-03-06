<input
    type="text"
    value="{{todo.todo}}"
    ng-model="todoEditCtrl.newText"
    ng-keypress="todoEditCtrl.edit($event, todo.todoNum)"
>
<span class="todoactions">
    <a class="action" ng-click="editCtrl.showEdit = false" title="Cancel">
        <img class="svg" src="/core/img/actions/close.svg">
    </a>
</span>