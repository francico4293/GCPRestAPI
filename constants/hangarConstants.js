'use strict';

const MIN_CAPACITY = 1;

const MAX_CAPACITY = 5;

const HANGAR_NAME_REGEX = /^[A-Za-z0-9 ./,-]+$/;

const HANGAR_STATE_REGEX = /^[A-Za-z ]+$/;

const HANGAR_CITY_REGEX = /^[A-Za-z .,]+$/;

const NAME = 'name';

const CITY = 'city';

const STATE = 'state';

const CAPACITY = 'capacity';

module.exports = {
    MIN_CAPACITY,
    MAX_CAPACITY,
    HANGAR_NAME_REGEX,
    HANGAR_CITY_REGEX,
    HANGAR_STATE_REGEX,
    NAME,
    CITY,
    STATE,
    CAPACITY
};
