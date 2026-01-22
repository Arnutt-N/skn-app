export default function TestPage() {
    return (
        <div style={{ padding: '50px', textAlign: 'center', backgroundColor: 'red', color: 'white' }}>
            <h1>TEST PAGE - CONNECTED TO CORRECT SYSTEM</h1>
            <p>If you see this RED page, the frontend server is correctly reading these files.</p>
            <p>Time: {new Date().toLocaleTimeString()}</p>
        </div>
    )
}
