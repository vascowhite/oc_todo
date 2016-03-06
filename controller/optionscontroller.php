<?php
/**
 * Created by PhpStorm.
 * User: paul
 * Date: 10/02/16
 * Time: 17:11
 */

namespace OCA\Todo\Controller;


use OCP\AppFramework\Controller;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\JSONResponse;
use OCA\Todo\Service\TodoService;
use OCP\IRequest;
use OCP\IConfig;

class OptionsController extends Controller
{
    use Response;

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
     * @param string $option
     * @param string $value
     * @return JSONResponse
     */
    public function setOption($option, $value)
    {
        //Option values are passed base64 encoded to avoid problems with paths looking like URL's
        $value = base64_decode($value);
        $this->config->setUserValue($this->userId, $this->appName, $option, $value);
        return $this->generateResponse(function(){
            return $this->service->getOptions();
        });
    }

    /**
     * @NoAdminRequired
     *
     * @return JSONResponse
     */
    public function getOptions()
    {
        return $this->generateResponse(function(){
            return $this->service->getOptions();
        });
    }
}