<div>
    <ul  class="with-icon">
        <li ng-repeat="sorter in collectionCtrl.sorters"
            class="todo-list">
            <a href="{{collectionCtrl.getUrl(sorter)}}" class="{{collectionCtrl.getClass(sorter)}}">
                <span class="title">{{sorter}}</span>
            </a>
        </li>
    </ul>
</div>