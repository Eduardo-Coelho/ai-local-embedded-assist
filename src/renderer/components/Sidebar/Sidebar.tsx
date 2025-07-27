

interface SidebarProps {
    modelName: string;
    modelSize: string;
    modelStatus: boolean;
   
}

export const Sidebar = ({modelName, modelSize, modelStatus}: SidebarProps) => {
    return (
        <div className="sidebar">
        <div className="sidebar-section">
          <h3>Model Information</h3>
          <div className="model-info">
            <p><strong>Model:</strong> {modelName}</p>
            <p><strong>Size:</strong> {modelSize}</p>
            <p><strong>Status:</strong> {modelStatus ? '✅ Loaded' : '❌ Not Loaded'}</p>
          </div>
        </div>
        
        <div className="sidebar-section">
          <h3>Features</h3>
          <ul>
            <li>✅ Local AI Processing</li>
            <li>✅ Offline Capability</li>
            <li>✅ Privacy Focused</li>
            <li>✅ DeepSeek Lite Model</li>
          </ul>
        </div>
        
        <div className="sidebar-section">
          <h3>Usage Tips</h3>
          <ul>
            <li>💡 Ask coding questions</li>
            <li>💡 Request explanations</li>
            <li>💡 Get creative writing help</li>
            <li>💡 All processing is local</li>
          </ul>
        </div>
        
      </div>
    )
}
