<?php
/**
 * Webiny Platform (http://www.webiny.com/)
 *
 * @copyright Copyright (c) 2009-2014 Webiny LTD. (http://www.webiny.com/)
 * @license   http://www.webiny.com/platform/license
 */

namespace Apps\Core\Php\PackageManager;

use Webiny\Component\Config\ConfigObject;
use Webiny\Component\StdLib\StdObjectTrait;
use Apps\Core\Php\DevTools\DevToolsTrait;

/**
 * Description
 */
trait ParsersTrait
{
    use StdObjectTrait, DevToolsTrait;

    private $namespace;

    /**
     * Parses the class namespace based on its path.
     *
     * @param string $path Path to the class.
     */
    protected function parseNamespace($path) {
        $this->namespace = $this->str($path)->replace(DIRECTORY_SEPARATOR, '\\')->val();
    }

    /**
     * Parses and registers events attached to the component.
     *
     * @param ConfigObject $info Parsed Component.yaml ConfigObject.
     */
    private function parseEvents(ConfigObject $info) {
        $eventConfig = $info->get('Events', [], true);
        if(count($eventConfig) > 0) {
            foreach ($eventConfig as $eventGroupName => $eventGroups) {
                $eventName = $eventGroupName;
                foreach ($eventGroups as $subGroupName => $subGroupEvents) {
                    $eventName .= '.' . $subGroupName;
                    foreach ($subGroupEvents as $eName => $callback) {
                        $sEventName = $eventName . '.' . $eName;

                        // If single callback
                        if(is_string($callback)){
                            $this->addListener($sEventName, $callback);
                            continue;
                        }

                        // If multiple callbacks provided...
                        foreach($callback as $c){
                            $this->addListener($sEventName, $c);
                        }
                    }
                }
            }
        }
    }

    private function addListener($eventName, $callback)
    {
        if(is_string($callback)){
            $callback = $this->str($callback)->replace('/', '\\');
            $priority = 300;
        } else {
            $priority = isset($callback['Priority']) ? $callback['Priority'] : 300;
            $callback = $this->str($callback['Handler'])->replace('/', '\\');
        }

        if(!$callback->contains('::')) {
            $callback->append('::handle');
        }

        if($callback->startsWith('\\')) {
            $this->wEvents()->listen($eventName, $callback->val(), $priority);
        } else {
            $this->wEvents()->listen($eventName, $this->namespace . '\\' . $callback->val(), $priority);
        }
    }

    /**
     * Parses and registers routes attached to the component.
     *
     * @param ConfigObject $info Parsed Component.yaml ConfigObject.
     */
    private function parseRoutes(ConfigObject $info) {
        $routes = $info->get('Routes', false);
        if($routes) {
            $this->wRouter()->registerRoutes($routes);
        }
    }
}
