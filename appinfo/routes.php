<?php
/**
 * ownCloud - ToDo
 *
 * @author Paul White
 * @copyright 2015 Paul White paul@vascowhite.co.uk
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU AFFERO GENERAL PUBLIC LICENSE
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU AFFERO GENERAL PUBLIC LICENSE for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with this library.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

namespace OCA\Todo;

return ['routes' =>[
    //Page
	['name' => 'page#index', 'url' => '/', 'verb' => 'GET'],
    //Ajax
    ['name' => 'ajax#get', 'url' => '/get', 'verb' => 'GET'],
	['name' => 'ajax#doTodo', 'url' => '/do/{todoNum}', 'verb' => 'PUT'],
	['name' => 'ajax#undoTodo', 'url' => '/undo/{todoNum}', 'verb' => 'PUT'],
    ['name' => 'ajax#addTodo', 'url' => '/add', 'verb' => 'POST'],
	['name' => 'ajax#updateTodo', 'url' => '/update/{todoNum}', 'verb' => 'PUT'],
	['name' => 'ajax#archive', 'url' => '/archive', 'verb' => 'POST'],
    ['name' => 'ajax#getProjects', 'url' => '/projects', 'verb' => 'GET'],
    ['name' => 'ajax#getContexts', 'url' => '/contexts', 'verb' => 'GET'],
	//Templates
	['name' => 'template#getTemplate', 'url' => '/template/{templateName}', 'verb' => 'GET'],
	//Options
    ['name' => 'options#setOption', 'url' => '/options/{option}', 'verb' => 'PUT'],
    ['name' => 'options#getOptions', 'url' => '/options', 'verb' => 'GET'],
]];