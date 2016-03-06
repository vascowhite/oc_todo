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

namespace OCA\Todo\Controller;

use OCA\Todo\Service\TodoService;
use \OCP\AppFramework\Controller;
use \OCP\AppFramework\Http\TemplateResponse;
use OCP\IConfig;
use OCP\IRequest;

/**
 * Controller class for main page.
 */
class PageController extends Controller {

    /**
     * @var TodoService
     */
    private $service;

    /**
     * @var string
     */
    private $userId;

    /**
     * @var IConfig
     */
    private $config;

    /**
     * @param string      $AppName
     * @param IRequest    $request
     * @param TodoService  $service
     * @param string      $UserId
     * @param IConfig     $config
     */
    public function __construct($AppName, IRequest $request, TodoService $service, $UserId, IConfig $config)
    {
        parent::__construct($AppName, $request);
        $this->service = $service;
        $this->userId = $UserId;
        $this->config = $config;
        $this->setUp();
    }

    public function setUp()
    {
        if($this->config->getUserValue($this->userId, $this->appName, 'todoPath') === ''){
            $this->config->setUserValue($this->userId, $this->appName, 'todoPath', 'todo.txt');
        }
        if($this->config->getUserValue($this->userId, $this->appName, 'donePath') === ''){
            $this->config->setUserValue($this->userId, $this->appName, 'donePath', 'done.txt');
        }
    }

	/**
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 */
	public function index()
    {
        \OCP\Util::addStyle($this->appName, '../js/bower_components/bootstrap/dist/css/bootstrap');
        \OCP\Util::addStyle($this->appName, 'style');
        \OCP\Util::addScript($this->appName, 'bower_components/bower-angularjs/angular.min');
        \OCP\Util::addScript($this->appName, 'bower_components/bower-angularjs/angular-route.min');
        \OCP\Util::addScript($this->appName, 'bower_components/bootstrap/dist/js/bootstrap');
        \OCP\Util::addScript($this->appName, 'public/app');
        \OCP\Util::addScript($this->appName, 'app/services/todoOptions');
        \OCP\Util::addScript($this->appName, 'app/services/todoList');
        \OCP\Util::addScript($this->appName, 'app/services/todoConnector');
        \OCP\Util::addScript($this->appName, 'app/directives/todonavigation');
        \OCP\Util::addScript($this->appName, 'app/directives/todoContent');
        \OCP\Util::addScript($this->appName, 'app/directives/todoSettings');
        \OCP\Util::addScript($this->appName, 'app/directives/todoItem');
        \OCP\Util::addScript($this->appName, 'app/directives/todoEditItem');
        \OCP\Util::addScript($this->appName, 'app/directives/todoListFile');
        \OCP\Util::addScript($this->appName, 'app/directives/todoListAlpha');
        \OCP\Util::addScript($this->appName, 'app/directives/todoListPriority');
        \OCP\Util::addScript($this->appName, 'app/directives/todoListProject');
        \OCP\Util::addScript($this->appName, 'app/directives/todoListContext');
        \OCP\Util::addScript($this->appName, 'app/directives/todoListDueDate');
        \OCP\Util::addScript($this->appName, 'app/directives/todoAddNew');

		$response = new TemplateResponse(
            'todo',
            'main'
        );
		return $response;
	}
}