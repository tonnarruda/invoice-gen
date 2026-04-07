import { useState } from 'react'

export default function InvoiceForm({ initialData, onGenerate }) {
  const [form, setForm] = useState(initialData)

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const updateItem = (index, field, value) => {
    setForm((prev) => {
      const items = [...prev.items]
      items[index] = { ...items[index], [field]: value }
      const rate = parseFloat(items[index].rate) || 0
      const qty = parseFloat(items[index].quantity) || 0
      items[index].amount = (qty * rate).toFixed(2)
      return { ...prev, items }
    })
  }

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { description: '', rate: '', quantity: '', amount: '0.00' }],
    }))
  }

  const removeItem = (index) => {
    if (form.items.length <= 1) return
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onGenerate(form)
  }

  return (
    <form className="form-container" onSubmit={handleSubmit}>
      <h1>Invoice Generator</h1>

      <div className="form-section">
        <h3>Invoice Info</h3>
        <div className="form-row">
          <div>
            <label>Invoice ID</label>
            <input value={form.invoiceId} onChange={(e) => updateField('invoiceId', e.target.value)} />
          </div>
          <div>
            <label>Invoice Date</label>
            <input type="date" value={form.invoiceDate} onChange={(e) => updateField('invoiceDate', e.target.value)} />
          </div>
          <div>
            <label>Due Date</label>
            <input type="date" value={form.dueDate} onChange={(e) => updateField('dueDate', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Billed To</h3>
        <div className="form-row">
          <div>
            <label>Name</label>
            <input value={form.billedName} onChange={(e) => updateField('billedName', e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div>
            <label>Address</label>
            <textarea rows={4} value={form.billedAddress} onChange={(e) => updateField('billedAddress', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Pay To</h3>
        <div className="form-row">
          <div>
            <label>Name</label>
            <textarea rows={6} value={form.payName} onChange={(e) => updateField('payName', e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div>
            <label>Account Number</label>
            <input value={form.accountNumber} onChange={(e) => updateField('accountNumber', e.target.value)} />
          </div>
          <div>
            <label>Routing Number</label>
            <input value={form.routingNumber} onChange={(e) => updateField('routingNumber', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Line Items</h3>
        <div className="line-items-header">
          <span className="col-item">Item</span>
          <span className="col-qty">Quantity</span>
          <span className="col-rate">Rate</span>
          <span className="col-amount">Amount</span>
          <span className="col-actions"></span>
        </div>
        {form.items.map((item, i) => (
          <div className="line-item" key={i}>
            <input
              className="col-item"
              placeholder="Description of item/service..."
              value={item.description}
              onChange={(e) => updateItem(i, 'description', e.target.value)}
            />
            <input
              className="col-qty"
              placeholder="1"
              value={item.quantity}
              onChange={(e) => updateItem(i, 'quantity', e.target.value)}
            />
            <div className="rate-input col-rate">
              <span className="rate-prefix">$</span>
              <input
                placeholder="0"
                value={item.rate}
                onChange={(e) => updateItem(i, 'rate', e.target.value)}
              />
            </div>
            <span className="col-amount amount-display">
              {form.currency === 'USD' ? 'US$' : form.currency} {parseFloat(item.amount || 0).toFixed(2).replace('.', ',')}
            </span>
            <button type="button" className="remove-btn col-actions" onClick={() => removeItem(i)}>×</button>
          </div>
        ))}
        <button type="button" className="btn btn-add" onClick={addItem}>+ Line Item</button>
      </div>

      <div className="form-section">
        <h3>Currency</h3>
        <div className="form-row">
          <div>
            <label>Currency</label>
            <input value={form.currency} onChange={(e) => updateField('currency', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="actions">
        <button type="submit" className="btn btn-primary">Preview Invoice</button>
      </div>
    </form>
  )
}
