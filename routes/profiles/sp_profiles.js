const defined = require('defined');
const { RecordNotFound, NotNullViolation } = require('../../errors');
const has = require('has');

const R = require('ramda');

module.exports = (SpProfile, userAllowedReadKeys, Email) => {
  return {
    createSpProfile: async (req, res) => {
      /* TODO: validate input */
      let data = req.body;

      /* Save data to  db */
      try {
        let id = await SpProfile.create(data, req.user);
        res.status(200).json(id);
      } catch (e) {
        if (e instanceof NotNullViolation) {
          res.boom.badData(e.message);
        } else {
          logger.error(e);
          res.boom.badImplementation('server error!');
        }
      }
    },

    getSpProfile: async (req, res) => {
      /* TODO: validate input */
      let id = req.params.id;

      let [spProfile] = await SpProfile.findById(id);
      if (defined(spProfile)) {
        if (req.user.role === 'sp') {
          spProfile = R.pick(userAllowedReadKeys, spProfile);
        }
        res.status(200).json(spProfile);
      } else {
        res.boom.notFound('That profile does not exist');
      }
    },

    getSpProfiles: async (req, res) => {
      let spProfiles = await SpProfile.find();
      res.status(200).json(spProfiles);
    },

    updateSpProfile: async (req, res) => {
      /* TODO: validate input */
      let data = req.body;

      let id = req.params.id;

      /* Save data to db */
      try {
        await SpProfile.update(id, data, req.user);

        // notify admin on updates
        await Email.notifyAdmin();
        res.status(200).send('Success');
      } catch (e) {
        if (e instanceof RecordNotFound) {
          return res.boom.badRequest(e.message);
        } else {
          throw e;
        }
      }
    }
  };
};
