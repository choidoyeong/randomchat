const moongoose = require('mongoose')
const Schema = moongoose.Schema

const User = new Schema({
    username: String,
    password: String,
    admin: { type: Boolean, default: false}
})

User.statics.create = function(username, password) {
    const user = new this({
        username,
        password
    })

    return user.save()
}

User.statics.findOneByUsername = function(username) {
    return this.findOne({
        username
    }).exec()
}

User.methods.verify = function(password) {
    return this.password === password
}

User.methods.assignAdmin = function() {
    this.admin = true
    return this.save()
}

module.exports = moongoose.model('User', User)