import { useRef } from 'react'
import html2pdf from 'html2pdf.js'

function formatDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${m}/${d}/${y}`
}

export default function InvoicePreview({ data, onBack }) {
  const invoiceRef = useRef()

  const subtotal = data.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)

  const downloadPDF = () => {
    const element = invoiceRef.current
    const cleanId = data.invoiceId.replace(/[^a-zA-Z0-9-]/g, '')
    html2pdf()
      .set({
        margin: [0, 0, 0, 0],
        filename: `invoice-${cleanId}-${data.invoiceDate}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(element)
      .save()
  }

  return (
    <div className="invoice-page">
      <div className="back-btn-row">
        <button className="btn btn-secondary" onClick={onBack}>← Back to Form</button>
        <button className="btn btn-primary" onClick={downloadPDF}>Download PDF</button>
      </div>

      <div className="invoice" ref={invoiceRef}>
        <div className="invoice-title">Invoice</div>

        <div className="invoice-meta">
          <div><span className="label">Invoice ID:</span> <span className="value">{data.invoiceId}</span></div>
          <div><span className="label">Invoice Date:</span> <span className="value">{formatDate(data.invoiceDate)}</span></div>
          <div><span className="label">Due date:</span> <span className="value">{formatDate(data.dueDate)}</span></div>
        </div>

        <div className="parties">
          <div className="party">
            <h3>Billed to:</h3>
            <p>
              {data.billedName}<br />
              {data.billedAddress.split('\n').map((line, i) => (
                <span key={i}>{line}<br /></span>
              ))}
            </p>
          </div>
          <div className="party">
            <h3>Pay to:</h3>
            <p>
              {data.payName.split('\n').map((line, i) => (
                <span key={i}>{line}<br /></span>
              ))}
              {data.accountNumber && <>Acount Number: {data.accountNumber}<br /></>}
              {data.routingNumber && <>Routing Number: {data.routingNumber}</>}
            </p>
          </div>
        </div>

        <table className="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => (
              <tr key={i}>
                <td>{item.description}</td>
                <td>{parseFloat(item.quantity || 0).toFixed(2)}</td>
                <td>{parseFloat(item.amount || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="subtotal-row">
          <span className="label">Subtotal</span>
          <span className="value">{subtotal.toFixed(2)} {data.currency}</span>
        </div>

        <div className="total-section">
          <div className="total-label">TOTAL</div>
          <div className="total-value">{subtotal.toFixed(2)} {data.currency}</div>
        </div>

        
      </div>
    </div>
  )
}
