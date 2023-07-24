const { User, Videogame, Favorite } = require('../db')
const sgMail = require('@sendgrid/mail')
const fs = require('fs')
const path = require('path')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const welcomeEmailPath = path.join(
  __dirname,
  '../apiData/emailContent/WelcomeEmail.html'
)
const welcomeEmailContent = fs.readFileSync(welcomeEmailPath, 'utf8')

// Obtener todos los usuarios
const getUsers = async () => {
  try {
    const users = await User.findAll({
      include: Videogame,
    })
    return { results: users }
  } catch (error) {
    throw new Error('Error al obtener los usuarios')
  }
}

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, { attributes: ['id', 'email', 'nickname'] });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Obtener un usuario por su email
const getUserByEmail = async (email) => {
  try {
    const user = await User.findOne({
      where: { email: email },
      include: Videogame,
    })

    return user.dataValues
  } catch (error) {
    throw new Error('Error al obtener el usuario por email')
  }
}

// Función para enviar el correo electrónico de bienvenida
const sendWelcomeEmail = async (email, name) => {
  try {
    const msg = {
      to: email,
      from: 'pfvideogames@gmail.com',
      subject: '¡Bienvenido a GameStore!',
      html: welcomeEmailContent.replace('{{name}}', name), // Reemplazar {{name}} con el nombre del usuario
    }

    await sgMail.send(msg)
    console.log('Correo electrónico de bienvenida enviado')
  } catch (error) {
    console.error('Error al enviar el correo electrónico de bienvenida:', error)
  }
}

// Crear un nuevo usuario
const postUser = async (req, res) => {
  try {
    const { email, name } = req.body

    const [user, created] = await User.findOrCreate({
      where: { email: email },
      defaults: { name: req.body.name, email, nickname: req.body.nickname },
    })

    if (created) {
      // Enviar correo electrónico de bienvenida
      await sendWelcomeEmail(email, name)

      return res.status(201).json({ user, message: 'Usuario creado' })
    } else {
      return res.status(200).json({ user, message: 'Usuario existente' })
    }
  } catch (error) {
    console.error('Error al crear o buscar el usuario:', error)
    return res.status(500).send('Error al crear o buscar el usuario')
  }
}

// Borrar un usuario por su ID
const deleteUser = async (id) => {
  try {
    const user = await User.findByPk(id)
    if (!user) throw new Error('Usuario no encontrado')

    await user.destroy()

    return 'Usuario borrado exitosamente'
  } catch (error) {
    throw new Error('Error al borrar el usuario')
  }
}

// Modificar un usuario por su ID
const updateUser = async (id, newData) => {
  try {
    const user = await User.findByPk(id)
    if (!user) throw new Error('Usuario no encontrado')

    await user.update(newData)

    return 'Usuario actualizado exitosamente'
  } catch (error) {
    throw new Error('Error al modificar el usuario')
  }
}

const postFavorite = async (email, videogameId) => {
  try {
    const user = await User.findOne({ where: { email } })
    const videogame = await Videogame.findByPk(videogameId)

    if (!user || !videogame) throw new Error('No se encontro usuario y/o videojuego')

    const favorite = await Favorite.findOrCreate({ where: { userId: user.id, videogameId: videogame.id } })

    return favorite
    
  } catch (error) {
    console.log(error)
    throw error
  }
}

const deleteFavorite = async (id) => {
    try {
        await Favorite.destroy({ where: { id } })
    } catch (error) {
        throw error
    }
}

const getUserFavorites = async (id) => {
  try {
    const response = await User.findOne({ where: { id }, include: [
      {
        model: Favorite,
        include: [
          {
            model: Videogame,
            attributes: ['id', 'image', 'name'],
          },
        ],
      },
    ] })
    return response
  } catch (error) {
    throw error
  }
}

module.exports = {
  getUsers,
  getUserByEmail,
  postUser,
  deleteUser,
  updateUser,
  postFavorite,
  deleteFavorite,
  getUserById,
  getUserFavorites
}
