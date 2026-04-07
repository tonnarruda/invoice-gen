import { useState } from 'react'
import InvoiceForm from './components/InvoiceForm'
import InvoicePreview from './components/InvoicePreview'
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
  const [view, setView] = useState('form')
  const [invoiceData, setInvoiceData] = useState(defaultData)

  const handleGenerate = (data) => {
    setInvoiceData(data)
    setView('preview')
  }

  if (view === 'preview') {
    return (
      <InvoicePreview
        data={invoiceData}
        onBack={() => setView('form')}
      />
    )
  }

  return (
    <InvoiceForm
      initialData={invoiceData}
      onGenerate={handleGenerate}
    />
  )
}

export default App
