import { createContext, useContext } from 'react'
import { addToast } from '../components/ToastContainer'

const ToastContext = createContext({})

export function ToastProvider({ children }) {
  return (
    <ToastContext.Provider value={{ showToast: addToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
