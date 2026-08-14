import {
    MapPin,
} from "lucide-react";

import {
    publicSiteConfig,
} from "@/config/public-site";

export function PublicFooter() {
    return (
        <footer className="bp-public-footer">
            <div className="bp-public-container bp-public-footer-inner">
                <div className="bp-public-footer-brand">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={publicSiteConfig.logoPath}
                        alt=""
                    />

                    <div>
                        <strong>
                            {publicSiteConfig.name}
                        </strong>
                        <span>
                            {publicSiteConfig.displayName}
                            {" · "}
                            {publicSiteConfig.institution}
                        </span>
                    </div>
                </div>

                <div className="bp-public-footer-links">
                    <a
                        href={publicSiteConfig.instagram.url}
                        target="_blank"
                        rel="noreferrer noopener"
                    >
                        {publicSiteConfig.instagram.label}
                    </a>

                    {publicSiteConfig.headquarters ? (
                        <span>
                            <MapPin size={17} />
                            {publicSiteConfig.headquarters}
                        </span>
                    ) : null}
                </div>
            </div>
        </footer>
    );
}
