interface SidebarProps {
  modelName: string;
  modelSize: string;
  modelStatus: boolean;
}

export const Sidebar = ({
  modelName,
  modelSize,
  modelStatus,
}: SidebarProps) => {
  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <h3>Model Information</h3>
        <div className="model-info">
          <p>
            <strong>Model:</strong> {modelName}
          </p>
          <p>
            <strong>Size:</strong> {modelSize}
          </p>
          <p>
            <strong>Status:</strong>{' '}
            {modelStatus ? '✅ Loaded' : '❌ Not Loaded'}
          </p>
        </div>
      </div>
    </div>
  );
};
