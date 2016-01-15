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
        $todoList = $this->service->getList();
		$response = new TemplateResponse(
            'todo',
            'main',
            [
                'todoList' => $todoList,
                'todoPath' => $this->config->getUserValue($this->userId, $this->appName, 'todoPath'),
                'donePath' => $this->config->getUserValue($this->userId, $this->appName, 'donePath'),
                'hiliteOverdue' => $this->config->getUserValue($this->userId, $this->appName, 'hiliteOverdue'),
                'autoArchive' => $this->config->getUserValue($this->userId, $this->appName, 'autoArchive'),
            ]
        );
		return $response;
	}
}