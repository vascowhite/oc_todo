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
namespace OCA\Todo\AppInfo;

require_once __DIR__ . '/../vendor/autoload.php';

use OCP\AppFramework\App;

$app = new App('todo');
$serverContainer = $app->getContainer()->getServer();

$app->getContainer()->getServer()->getNavigationManager()->add([
        'id' => $app->getContainer()->getAppName(),
        'order' => 100,
        'href' => $serverContainer->getURLGenerator()->linkToRoute('todo.page.index'),
        'icon' => $serverContainer->getURLGenerator()->imagePath('todo', 'todotxt.png'),
        'name' => $serverContainer->getL10N('Todo')->t('Todo'),
    ]
);