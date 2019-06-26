const jwt = require('jsonwebtoken')
const User = require('../../../models/user')

exports.register = (req, res) => {
    const { username, password } = req.body
    let newUser = null

    const create = (user) => {
        if(user) {
            throw new Error('username exists')
        } else {
            return User.create(username, password)
        }
    }

    const count = (user) => {
        newUser = user
        return User.count({}).exec()
    }

    const assign = (count) => {
        if(count === 1) {
            return newUser.assignAdmin()
        } else {
            return Promise.resolve(false)
        }
    }

    const respond = (isAdmin) => {
        res.json({
            message: 'registered successfully',
            admin: isAdmin ? true : false
        })
    }

    const onError = (error) => {
        res.status(409).json({
            message: error.message
        })
    }
    
    User.findOneByUsername(username)
    .then(create)
    .then(count)
    .then(assign)
    .then(respond)
    .catch(onError)
}

exports.login = (req, res) => {
    const {username, password} = req.body
    const secret = req.app.get('jwt-secret')

    const check = (user) => {
        if(!user) {
            throw new Error ('login failed')
        } else {
            if(user.verify(password)) {
                const p = new Promise((resolve, reject) => {
                    jwt.sign(
                        {
                            _id: user._id,
                            username: username,
                            admin: user.admin
                        },
                        secret,
                        {
                            expiresIn: '7d',
                            issuer: 'doyeong',
                            subject: 'userInfo'
                        }, (err, token) => {
                            if(err) reject(err)
                            resolve(token)
                        })
                })
                return p
            } else {
                throw new Error('login failed')
            }
        }
    }

    const respond = (token) =>{
        res.json({
            message: 'logged in successfully',
            token
        })
    } 

    const onError = (error) => {
        res.status(403).json({
            message: error.message
        })
    }

    User.findOneByUsername(username)
    .then(check)
    .then(respond)
    .catch(onError)

}

exports.check = (req, res) => {
    res.json({
        success: true,
        info: req.decoded
    })
}