<?php
/**
 * Created by PhpStorm.
 * User: paul
 * Date: 10/02/16
 * Time: 09:55
 */

namespace OCA\Todo\Controller;


use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\TemplateResponse;

class TemplateController extends Controller
{
    /**
     * @param string $templateName
     * @return TemplateResponse
     *
     * @NoAdminRequired
     */
    public function getTemplate($templateName)
    {
        $template = new TemplateResponse($this->appName, $templateName);
        $template->renderAs('blank');
        return $template;
    }
}