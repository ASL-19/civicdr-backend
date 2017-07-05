const R = require('ramda');
const defined = require('defined');
const withError = require('../../utils/with-error');
const xtend = require('xtend');
const { RecordNotFound, NotNullViolation } = require('../../errors');

const spAllowedReadKeys = [
  'id',
  'name',
  'services',
  'description',
  'contact',
  'secure_channels',
  'fees',
  'languages',
  'pgp_key',
  'start_time',
  'per_week_availability',
  'email_notification'
];

const ipAllowedReadKeys = [
  'id',
  'name',
  'contact',
  'location',
  'notification_prefs',
  'notification_languages',
  'types_of_work',
  'pgp_key',
  'secure_channels',
  'languages',
  'internal_level',
  'email_notification'
];

module.exports = conn => {
  // Models
  const IpProfile = require('../../models/ip_profile')(conn);
  const SpProfile = require('../../models/sp_profile')(conn);
  const Delete = require('../../models/delete')(conn);
  const Email = require('../../models/email')(conn);

  // Routes
  const IpProfileRoutes = require('./ip_profiles')(
    IpProfile,
    ipAllowedReadKeys,
    Email
  );
  const SpProfileRoutes = require('./sp_profiles')(
    SpProfile,
    spAllowedReadKeys,
    Email
  );

  let myProfile = {
    createProfile: async (req, res) => {
      let role = req.user.role;

      // Only allow a user to create their profile once
      const openid = req.user.sub;
      let profile;
      if (role === 'ip') {
        [profile] = await IpProfile.findByOpenId(openid);
      } else if (role === 'sp') {
        [profile] = await SpProfile.findByOpenId(openid);
      }
      if (profile) {
        return res.boom.badRequest('Profile already exists');
      }

      /* TODO: validate input */
      let data = xtend({ openid }, req.body);

      try {
        if (role === 'ip') {
          let id = await IpProfile.create(data);
          res.status(200).json(id);
        } else if (role === 'sp') {
          data.rating = data.rating || 0;
          let id = await SpProfile.create(data);
          res.status(200).json(id);
        } else {
          return res.boom.badRequest("Can't create profile");
        }
      } catch (e) {
        if (e instanceof NotNullViolation) {
          return res.boom.badData(e.message);
        } else {
          throw e;
        }
      }
    },

    getProfile: async (req, res) => {
      let profile = req.user.profile;

      if (!defined(profile)) {
        return res.boom.notFound();
      } else {
        if (req.user.role === 'ip') {
          profile = R.pick(ipAllowedReadKeys, profile);
        }

        if (req.user.role === 'sp') {
          profile = R.pick(spAllowedReadKeys, profile);
        }

        res.status(200).json(profile);
      }
    }
  };

  let deleteProfileRoute = type => {
    return async (req, res) => {
      let id = req.params.id;
      try {
        if (type === 'ip') {
          await Delete.deleteIp(id);
        } else if (type === 'sp') {
          await Delete.deleteSp(id);
        }
        res.status(200).send('Success');
      } catch (e) {
        if (e instanceof RecordNotFound) {
          res.boom.badRequest(e.message);
        } else {
          throw e;
        }
      }
    };
  };

  let deleteRoutes = {
    deleteIpProfile: deleteProfileRoute('ip'),
    deleteSpProfile: deleteProfileRoute('sp')
  };

  return withError(
    R.mergeAll([IpProfileRoutes, SpProfileRoutes, myProfile, deleteRoutes])
  );
};
