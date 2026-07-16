import { Link } from "react-router-dom";
import { EmptyState } from "@/components/domain/shared/EmptyState";
import { Button } from "@/components/ui/Button";

export const NotFoundRoute = () => {
  return (
    <EmptyState
      title="Page not found"
      description="The page you requested does not exist."
      action={
        <Button
          variant="outline"
          render={<Link to="/" />}
          className="btn-toolbar"
        >
          Back to servers
        </Button>
      }
      className="m-8"
    />
  );
};
