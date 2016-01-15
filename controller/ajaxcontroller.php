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

/**
 * User: Paul White
 * Date: 28/04/2015
 * 
 * File: ajaxcontroller.php
 * @package todo
 */
 
 /**
  * @package todo
  */

namespace OCA\Todo\Controller;
use OCA\Todo\Service\TodoService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\JSONResponse;
use OCP\IRequest;
use OCP\IConfig;
use Vascowhite\Todo\Todo;

class AjaxController extends Controller
{
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
     * @param TodoService $service
     * @param string      $UserId
     * @param IConfig     $config
     */
    public function __construct($AppName, IRequest $request, TodoService $service, $UserId, IConfig $config)
    {
        parent::__construct($AppName, $request);
        $this->service = $service;
        $this->userId = $UserId;
        $this->config = $config;
    }

    /**
     * @NoAdminRequired
     *
     * @return JSONResponse
     */
    public function get()
    {
        return new JSONResponse($this->service->getList());
    }

    /**
     * @NoAdminRequired
     *
     * @return JSONResponse
     */
    public function filters()
    {
        $filterArray = [];
        $filterArray['projects'] = $this->service->getProjects();
        $filterArray['contexts'] = $this->service->getContexts();
        return new JSONResponse($filterArray);
    }

    /**
     * @NoAdminRequired
     *
     * @param $todoText
     *
     * @return JSONResponse
     */
    public function addTodo($todoText)
    {
        //New todo's are passed base64 encoded to avoid url problems
        $todoText = base64_decode($todoText);
        $this->service->addTodo(Todo::createFromString($todoText));
        $response = new JSONResponse($this->service->getList());
        return $response;
    }

    /**
     * @NoAdminRequired
     *
     * @param int $todoNum
     *
     * @return JSONResponse
     */
    public function doTodo($todoNum)
    {
        $doneTodo = $this->service->doTodo($this->service->getTodoByNum($todoNum));
        return new JSONResponse($this->service->todoToArray($doneTodo));
    }

    /**
     * @NoAdminRequired
     *
     * @param int $todoNum
     *
     * @return JSONResponse
     */
    public function undoTodo($todoNum)
    {
        $undoneTodo = $this->service->undoTodo($this->service->getTodoByNum($todoNum));
        return new JSONResponse($this->service->todoToArray($undoneTodo));
    }

    /**
     * @NoAdminRequired
     *
     * @param $option
     * @param $value
     * @return JSONResponse
     */
    public function setOption($option, $value)
    {
        //Option values are passed base64 encoded to avoid problems with paths looking like URL's
        $value = base64_decode($value);
        $this->config->setUserValue($this->userId, $this->appName, $option, $value);
        return new JSONResponse($this->service->getOptions());
    }

    /**
     * @NoAdminRequired
     *
     * @param string $oldText
     * @param string $newText
     *
     * @return JSONResponse
     */
    public function updateTodo($oldText, $newText)
    {
        $oldText = trim(base64_decode($oldText));
        $newText = trim(base64_decode($newText));

        $result = $this->service->updateTodo($oldText, $newText);
        if($result){
            $response = new JSONResponse($this->service->getList());
        } else {
            $response = new JSONResponse([
                'error' => 'No match',
                'text' => 'Could not find "' . $oldText . '"',
            ]);
            $response->setStatus(Http::STATUS_NOT_FOUND);
        }

        return $response;
    }

    /**
     * @NoAdminRequired
     *
     * @return JSONResponse
     */
    public function archive()
    {
        return new JSONResponse([$this->service->archive()]);
    }
}