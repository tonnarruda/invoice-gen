import { useState } from 'react'
import InvoiceForm from './components/InvoiceForm'
import InvoicePreview from './components/InvoicePreview'
import TimerView from './components/TimerView'
import './App.css'

const defaultData = {
  invoiceId: '##KAD-2026-XX-XXXX',
  invoiceDate: '',
  dueDate: '',
  billedName: 'Kadince, Inc',
  billedAddress: '2637 North Washington Boulevard #154,\nNorth Ogden, UT 84414',
  payName: 'GEORGEM ARRUDA\n83778292315\nG. F. DE ARRUDA JUNIOR CONSULTORIA EM TECNOLOGIA DA INFORMACAO LTDA',
  accountNumber: '375404400216',
  routingNumber: '021214891',
  currency: 'USD',
  items: [{ description: 'kadince', rate: '10.00', quantity: '18.78', amount: '187.80' }],
}

function App() {
  const [page, setPage] = useState('timer')
  const [invoiceView, setInvoiceView] = useState('form')
  const [invoiceData, setInvoiceData] = useState(defaultData)

  const handleGenerate = (data) => {
    setInvoiceData(data)
    setInvoiceView('preview')
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar" aria-label="Navegação principal">
        <div className="app-sidebar-brand">invoice-gen</div>
        <nav className="app-sidebar-nav">
          <button
            type="button"
            className={`app-sidebar-link ${page === 'timer' ? 'active' : ''}`}
            onClick={() => setPage('timer')}
          >
            Timer
          </button>
          <button
            type="button"
            className={`app-sidebar-link ${page === 'invoice' ? 'active' : ''}`}
            onClick={() => setPage('invoice')}
          >
            Invoice
          </button>
        </nav>
      </aside>
      <main className="app-main">
        {page === 'timer' && <TimerView />}
        {page === 'invoice' && invoiceView === 'preview' && (
          <InvoicePreview
            data={invoiceData}
            onBack={() => {
              setInvoiceView('form')
            }}
          />
        )}
        {page === 'invoice' && invoiceView === 'form' && (
          <InvoiceForm initialData={invoiceData} onGenerate={handleGenerate} />
        )}
      </main>
    </div>
  )
}

export default App
