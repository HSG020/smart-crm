export type XLSXModule = {
  utils: {
    json_to_sheet: (data: any[]) => any
    book_new: () => any
    book_append_sheet: (workbook: any, worksheet: any, name: string) => void
    sheet_to_json: (worksheet: any, opts?: any) => any[]
  }
  write: (workbook: any, opts: { bookType: string; type: 'array' | 'binary' }) => ArrayBuffer | string
  read: (data: ArrayBuffer | string, opts: { type: 'array' | 'binary' }) => {
    SheetNames: string[]
    Sheets: Record<string, any>
  }
}

let cachedXLSX: XLSXModule | null = null
let loadingPromise: Promise<XLSXModule> | null = null

export const loadXLSX = async (): Promise<XLSXModule> => {
  if (cachedXLSX) {
    return cachedXLSX
  }

  if (!loadingPromise) {
    loadingPromise = import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm')
      .then((mod: any) => {
        const resolved = (mod?.default ?? mod) as XLSXModule
        cachedXLSX = resolved
        return resolved
      })
      .catch(error => {
        loadingPromise = null
        throw error
      })
  }

  return loadingPromise
}
