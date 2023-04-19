/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Footer } from '../../client/scripts/views/footer'

function sum(a, b) {
  return a + b;
}

describe('footer component', () => {
  test('displays the About link', () => {
    render(<Footer />);
    const aboutLink = screen.getByText('About');
    expect(aboutLink).toBeInTheDocument();
  })

  test('adds 1 + 2 to equal 3', () => {
    expect(sum(1, 2)).toBe(3);
  });
})

// import {useState, useReducer} from 'react'
// import axios from 'axios'
// import React from 'react'
// import {rest} from 'msw'
// import {setupServer} from 'msw/node'
// import {render, fireEvent, screen} from '@testing-library/react'
// import '@testing-library/jest-dom'

// const initialState = {
//   error: null,
//   greeting: null,
// }

// function greetingReducer(state, action) {
//   switch (action.type) {
//     case 'SUCCESS': {
//       return {
//         error: null,
//         greeting: action.greeting,
//       }
//     }
//     case 'ERROR': {
//       return {
//         error: action.error,
//         greeting: null,
//       }
//     }
//     default: {
//       return state
//     }
//   }
// }

// export default function Fetch({url}) {
//   const [{error, greeting}, dispatch] = useReducer(
//     greetingReducer,
//     initialState,
//   )
//   const [buttonClicked, setButtonClicked] = useState(false)

//   const fetchGreeting = async url =>
//     axios
//       .get(url)
//       .then(response => {
//         const {data} = response
//         const {greeting} = data
//         dispatch({type: 'SUCCESS', greeting})
//         setButtonClicked(true)
//       })
//       .catch(error => {
//         dispatch({type: 'ERROR', error})
//       })

//   const buttonText = buttonClicked ? 'Ok' : 'Load Greeting'

//   return (
//     <div>
//       <button onClick={() => fetchGreeting(url)} disabled={buttonClicked}>
//         {buttonText}
//       </button>
//       {greeting && <h1>{greeting}</h1>}
//       {error && <p role="alert">Oops, failed to fetch!</p>}
//     </div>
//   )
// }



// const server = setupServer(
//   rest.get('/greeting', (req, res, ctx) => {
//     return res(ctx.json({greeting: 'hello there'}))
//   }),
// )

// beforeAll(() => server.listen())
// afterEach(() => server.resetHandlers())
// afterAll(() => server.close())

// test('loads and displays greeting', async () => {
//   render(<Fetch url="/greeting" />)

//   fireEvent.click(screen.getByText('Load Greeting'))

//   await screen.findByRole('heading')

//   expect(screen.getByRole('heading')).toHaveTextContent('hello there')
//   expect(screen.getByRole('button')).toBeDisabled()
// })

// test('handles server error', async () => {
//   server.use(
//     rest.get('/greeting', (req, res, ctx) => {
//       return res(ctx.status(500))
//     }),
//   )

//   render(<Fetch url="/greeting" />)

//   fireEvent.click(screen.getByText('Load Greeting'))

//   await screen.findByRole('alert')

//   expect(screen.getByRole('alert')).toHaveTextContent('Oops, failed to fetch!')
//   expect(screen.getByRole('button')).not.toBeDisabled()
// })