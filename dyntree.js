/**
 *  @typedef {Object} list
 *  @property {number} id
 *  @property {string} name
 *  @property {string} code
 *  @property {string} description
 */

/**
 *  @typedef {Object} apiAnswer
 *  @property {string} status
 *  @property {list[]} result
 *  @property {string} errorCode
 *  @property {string} errorMessage
 */

/**
 *  @typedef {Object} config
 *  @property {boolean} showWatingMessage
 *  @property {number} cacheDepth
 */
var Dyntree = (function () {

    var apiUrl = '';

    /** @property {config} config*/
    var config = {};

    /** @property {{parent:number, list:list[]}} cache */
    var cache = {};

    /**
     *  @param {HTMLElement} parent
     *  @param {string} tagName
     *  @param {string} [innerHtml]
     *  @param {string} [className]
     *  @param {Object} [attributes]
     */
    function appendElement(parent, tagName, innerHtml, className, attributes) {
        var element = document.createElement(tagName);

        if (innerHtml)
            element.innerHTML = innerHtml;

        if (className)
            element.className = className;

        if (attributes && typeof attributes === "object") {
            for (var attr in attributes) {
                if (!attributes.hasOwnProperty(attr))
                    continue;

                element.setAttribute(attr, attributes[attr]);
            }
        }

        parent.appendChild(element);

        return element;
    }

    /**
     *  @param {HTMLElement} parentElement
     *  @param {number} parentId
     *  @param {boolean} isRoot
     *  @param {number} [currentDepth]
     */
    function loadList(parentElement, parentId, isRoot, currentDepth) {
        var url = apiUrl + (parentId ? '?parent=' + parentId : '');
        var wrapperId = $(parentElement).closest('.dyntree-wrapper')[0].id;

        if (!currentDepth)
            currentDepth = 0;

        if (config[wrapperId].showWatingMessage)
            var waitingText = appendElement(parentElement, 'div', 'Идёт загрузка...');

        $
            .getJSON(url, function (data) /** @param {apiAnswer} data */ {
                console.log(data);

                var list = data.result;

                cache[parentId] = list;

                if (isRoot)
                    insertList(parentElement, parentId, list);

                if (config[wrapperId].cacheDepth && currentDepth < config[wrapperId].cacheDepth) {
                    for (var i = 0; i < list.length; i++) {
                        loadList(parentElement, list[i].id, false, currentDepth + 1);
                    }
                }
            })
            .always(function () {
                if (config[wrapperId].showWatingMessage)
                    parentElement.removeChild(waitingText);
            });
    }

    /**
     *  @param {HTMLElement} parentElement
     *  @param {number} parentId
     *  @param {list[]} list
     */
    function insertList(parentElement, parentId, list) {
        var i, endPointClass;
        var ul = appendElement(parentElement, 'ul');

        var className = 'list-element list-folded' + (parentId ? ' nested' : '');

        for (i = 0; i < list.length; i++) {
            endPointClass = (cache[list[i].id] && cache[list[i].id].length === 0) ? ' list-endpoint' : '';

            appendElement(ul, 'li', list[i].name, className + endPointClass, {
                'title': list[i].name,
                'parent-id': list[i].id
            });
        }

        for (i = 0; i < list.length; i++) {
            if (!cache[list[i].id]) {
                loadList(parentElement, list[i].id, false);
            }
        }
    }

    /**
     *  @param {HTMLElement} parentElement
     *  @param {number} parentId
     *  @param {boolean} isRoot
     */
    function showChildList(parentElement, parentId, isRoot) {
        if (cache[parentId])
            insertList(parentElement, parentId, cache[parentId]);
        else
            loadList(parentElement, parentId, isRoot);
    }

    $(document).on({
        click: function (event) {
            $(this).removeClass('list-folded').addClass('list-unfolded');

            //noinspection JSCheckFunctionSignatures
            showChildList(this, this.getAttribute('parent-id'));
            event.stopPropagation();
        }
    }, '.list-element.list-folded');

    $(document).on({
        click: function (event) {
            $(this).removeClass('list-unfolded').addClass('list-folded').find('ul').remove();
            event.stopPropagation();
        }
    }, '.list-element.list-unfolded');

    /**
     * @param {string} wrapperId
     * @param {Object} [options]
     */
    function init(wrapperId, options) {
        config[wrapperId] = (options && typeof options === "object") ? options : {};

        var wrapper = document.getElementById(wrapperId);
        showChildList(wrapper, 0, true);
    }

    return {
        init: init
    };
})();
