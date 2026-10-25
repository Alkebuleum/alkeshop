import React from "react";
import { Link } from "react-router-dom";
import Shell from "../components/Shell";
import { EmptyState } from "../components/ui";

export default function NotFound() {
  return (
    <Shell tab="none">
      <EmptyState icon="search" title="We couldn't find that page" action={<Link to="/" className="btn-primary btn-sm">Go to AlkeShop</Link>}>
        It may have been removed, or the link is mistyped.
      </EmptyState>
    </Shell>
  );
}
