import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { postReview } from '../redux/actions/reviewAction'
import { IconX } from '@tabler/icons-react'
import { useAuth0 } from '@auth0/auth0-react'
import { getUser } from '../services/userService'
import useSWRImmutable from 'swr/immutable'; // Importa useSWRImmutable
import { getReviewByVideogameId } from '../services/reviewService'; 

const ReviewForm = ({ videogameId, closeForm }) => {
  const [score, setScore] = useState(1)
  const [text, setText] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(true); // Estado para controlar si el formulario está abierto o cerrado
  const dispatch = useDispatch()
  const { isAuthenticated, user } = useAuth0()
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    const fetchUserId = async () => {
      if (isAuthenticated && user.email) {
        try {
          const userData = await getUser(user.email)
          setUserId(userData.id)
        } catch (error) {
          console.log('Error al obtener el userId:', error)
        }
      }
    }

    fetchUserId()
  }, [isAuthenticated, user])

  const { data: reviews, error: reviewError } = useSWRImmutable(videogameId, getReviewByVideogameId);


  useEffect(() => {
    // Lógica adicional para obtener las reviews
  }, [videogameId]);

  const handleSubmit = (e) => {
    e.preventDefault()

    // Verificar si el usuario ya tiene una revisión para este videojuego
    const userReview = reviews?.find((review) => review.userId === userId);

    if (userReview) {
      // Mostrar mensaje de que ya tiene una revisión para este videojuego
      setIsFormOpen(false); // Ocultar el formulario
    } else {
      const review = {
        videogameId,
        score,
        text,
        userId,
      }

      dispatch(postReview(review))

      // Reset form fields
      setScore(1)
      setText('')

      closeForm()
    }
  }

  if (reviewError) {
    return <div>Error al cargar las revisiones del videojuego.</div>;
  }

  return (
    <div className='w-full bg-transparent py-8'>
      <div className='max-w-3xl mx-auto px-4 relative'>
        {isFormOpen && ( // Mostrar el formulario solo si está abierto
          <>
            <button
              className='absolute top-2 right-2 text-red-600 hover:text-red-700 border-red-600 border-2 rounded-lg p-2'
              onClick={closeForm}
            >
              <IconX className='w-8 h-8' />
            </button>
            <h2 className='text-3xl font-semibold text-center mb-6'>Review</h2>
            <form onSubmit={handleSubmit} className='bg-white p-6 rounded-lg shadow-md'>
              <div className='flex items-center justify-center'>
                <input
                  type='range'
                  min='1'
                  max='10'
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className='w-64'
                />
                <span
                  className={`text-${score === '10' ? '4xl' : '2xl'} font-semibold text-black ml-2`}
                >
                  {score}
                </span>
              </div>
              <div className='mt-4'>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder='Do you like this game?'
                  className='w-full h-32 px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-purple-500'
                ></textarea>
              </div>
              <button
                type='submit'
                className='bg-purple-600 text-white px-4 py-2 mt-4 rounded-md hover:opacity-80'
              >
                Submit
              </button>
            </form>
          </>
        )}
        {!isFormOpen && ( // Mostrar el mensaje solo si el formulario está cerrado
          <div className='text-center'>
            <h2 className='text-3xl font-semibold mb-6'>¡Ya tienes una review para este videojuego!</h2>
            <button
              className='bg-purple-600 text-white px-4 py-2 rounded-md hover:opacity-80'
              onClick={() => setIsFormOpen(true)} // Abrir el formulario al hacer clic en el botón
            >
              Volver
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReviewForm;
