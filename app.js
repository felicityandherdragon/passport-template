const express = require('express');
const app = express();
const User = require('./user.js');
const passport = require('passport');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const LocalStrategy = require('passport-local').Strategy;

const sequelize = require('./database.js')

User.sync({ alter: true });
const sessionStore = new SequelizeStore({
  db: sequelize,
})
sessionStore.sync()

passport.serializeUser((user, done) => {
  done(null, user.email)
})

passport.deserializeUser((email, done) => {
  User.findOne({ where: { email: email } }).then((user) => {
    done(null, user)
  })
})

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async function (email, password, done) {
      if (!email || !password) {
        done('Email and password required', null)
        return
      }

      const user = await User.findOne({ where: { email: email } })

      if (!user) {
        done('User not found', null)
        return
      }

      const valid = await user.isPasswordValid(password)

      if (!valid) {
        done('Email and password do not match', null)
        return
      }

      done(null, user)
    }
  )
)

app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: '343ji43j4n3jn4jk3n', //enter a random string here
    resave: false,
    saveUninitialized: true,
    name: 'testingpassport',
    cookie: {
      secure: false,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    },
    store: sessionStore,
  }),
  passport.initialize(),
  passport.session()
)

app.set('view engine', 'pug');

app.get('/', (req, res) => {
  req.session.passport ? res.render('index') : res.render('signup');
});

app.get('/login', (req, res) => {
  req.session.passport ? res.render('index') : res.render('login');
});

app.get('/logout', async (req, res)=> {
  req.logout();
  req.session.destroy();
  return res.redirect('/');
})

app.post('/register', async (req, res) => {
  console.log(req.body);
  try {
    const { email, password } = req.body
    const user = await User.create({
      email,
      password
    })
    req.login(user, (err) => {
      return res.redirect('/')
    })
  } catch(err) {
    res.statusCode = 500
    let message = 'An error occurred'
    if (err.name === 'SequelizeUniqueConstraintError') {
      message = 'User already exists. Use login instead.'
    }
    res.render('error', { message })
  }
});

app.post('/login', async (req, res) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return res.render('error', { message: err })
    if (!user)
      return res.render('error', { message: 'No user matching credentials' })

    req.login(user, (err) => {
      if (err) return res.render('error', { message: err })
      return res.redirect('/')
    })
  })(req, res)
});

app.listen(3001, () => {
  console.log('Server ready')
})
