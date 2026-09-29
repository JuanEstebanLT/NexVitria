import { useCallback, useEffect, useMemo, useState } from 'react'
import { attachProductMetadata } from '../data/productMetadata.js'
import { obtenerCategorias, obtenerProductos } from '../services/catalogService.js'
import { CatalogContext } from './catalogContext.js'

const createLoadingState = () => ({
  data: [],
  status: 'loading',
  error: null,
})

export function CatalogProvider({ children }) {
  const [productsState, setProductsState] = useState(createLoadingState)
  const [categoriesState, setCategoriesState] = useState(createLoadingState)
  const [productsRequest, setProductsRequest] = useState(0)
  const [categoriesRequest, setCategoriesRequest] = useState(0)

  const retryProducts = useCallback(() => {
    setProductsState(createLoadingState())
    setProductsRequest((current) => current + 1)
  }, [])

  const retryCategories = useCallback(() => {
    setCategoriesState(createLoadingState())
    setCategoriesRequest((current) => current + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    obtenerProductos({ signal: controller.signal })
      .then((products) => {
        if (controller.signal.aborted) return
        setProductsState({
          data: products.map(attachProductMetadata),
          status: 'success',
          error: null,
        })
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        setProductsState({ data: [], status: 'error', error })
      })

    return () => controller.abort()
  }, [productsRequest])

  useEffect(() => {
    const controller = new AbortController()

    obtenerCategorias({ signal: controller.signal })
      .then((categories) => {
        if (controller.signal.aborted) return
        setCategoriesState({ data: categories, status: 'success', error: null })
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        setCategoriesState({ data: [], status: 'error', error })
      })

    return () => controller.abort()
  }, [categoriesRequest])

  const value = useMemo(() => ({
    products: productsState.data,
    productsStatus: productsState.status,
    productsError: productsState.error,
    retryProducts,
    categories: categoriesState.data,
    categoriesStatus: categoriesState.status,
    categoriesError: categoriesState.error,
    retryCategories,
  }), [
    categoriesState,
    productsState,
    retryCategories,
    retryProducts,
  ])

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}
