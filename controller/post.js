/**
 * Get modules
 */
let baseController = require('../controller/base');
let postsModel = require('../model/post');

/**
 * Define post controller
 */
let postController = {
        /**
         * Get posts list
         * @param req
         * @param res
         * @created 2020-03-06 LongTHK
         */
        getList: function (req, res) {
            try {
                postsModel.getAll()
                    .then((response) => {
                        res.send(baseController.generateResponse(1, 'success', response));
                    })
                    .catch((err) => {
                        res.send(baseController.generateResponse(0, 'error'));
                    })
            } catch (e) {
                console.log(e);
            }
        },

        /**
         * Get post detail by slug
         * @param req
         * @param res
         * @created 2020-03-06 LongTHK
         */
        getDetail: function (req, res) {
            // get post by slug
            postsModel.getBySlug(req.params.slug)
                .then((response) => {
                    res.send(baseController.generateResponse(1, 'success', response));
                })
                .catch((err) => {
                    res.send(baseController.generateResponse(0, 'error'));
                })
        }

    }
;


/**
 * Export post controller
 * @type {{}}
 */
module.exports = postController;