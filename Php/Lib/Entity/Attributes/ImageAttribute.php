<?php

namespace Apps\Webiny\Php\Lib\Entity\Attributes;

use Apps\Webiny\Php\Entities\Image;

/**
 * File ImageAttribute
 */
class ImageAttribute extends FileAttribute
{
    protected $dimensions = [];

    /**
     * @inheritDoc
     */
    public function __construct()
    {
        parent::__construct();
        $this->setEntity(Image::class);
    }

    public function setDimensions(array $dimensions)
    {
        $this->dimensions = $dimensions;

        return $this;
    }

    public function getValue($params = [], $processCallbacks = true)
    {
        $value = parent::getValue($params, false);
        if ($value) {
            $value->setDimensions($this->dimensions);
        }

        return $processCallbacks ? $this->processGetValue($value, $params) : $value;
    }
}