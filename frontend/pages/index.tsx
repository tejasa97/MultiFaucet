import axios from "axios"; // Requests
import Image from "next/image"; // Image
import { ethers } from "ethers"; // Address check
import { toast } from "react-toastify"; // Toast notifications
import Layout from "components/Layout"; // Layout wrapper
import { ADDRESSES } from "utils/addresses"; // Faucet addresses
import styles from "styles/Home.module.scss"; // Styles
import { ReactElement, useState } from "react"; // Local state + types
import { hasClaimed } from "pages/api/claim/status"; // Claim status
import { signIn, getSession, signOut } from "next-auth/client"; // Auth

/**
 * Check if a provided address is valid
 * @param {string} address to check
 * @returns {boolean} validity
 */
function isValidAddress(address: string): boolean {
  try {
    // Check if address is valid + checksum match
    ethers.utils.getAddress(address);
  } catch {
    // If not, return false
    return false;
  }

  // Else, return true
  return true;
}

export default function Home({
  session,
  claimed: initialClaimed,
}: {
  session: any;
  claimed: boolean;
}) {
  // Claim address
  const [address, setAddress] = useState<string>("");
  // Claimed status
  const [claimed, setClaimed] = useState<boolean>(initialClaimed);
  // First claim
  const [firstClaim, setFirstClaim] = useState<boolean>(false);
  // Loading status
  const [loading, setLoading] = useState<boolean>(false);

  /**
   * Processes a claim to the faucet
   */
  const processClaim = async () => {
    // Toggle loading
    setLoading(true);

    try {
      // Post new claim with recipient address
      await axios.post("/api/claim/new", { address });
      // Toast if success + toggle claimed
      toast.success("Tokens dispersed—check balances shortly!");
      setClaimed(true);
      setFirstClaim(true);
    } catch (error: any) {
      // If error, toast error message
      toast.error(error.response.data.error);
    }

    // Toggle loading
    setLoading(false);
  };

  return (
    <Layout>
      {/* CTA + description */}
      <div className={styles.home__cta}>
        <div>
          <a
            href="https://paradigm.xyz"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image src="/logo.svg" height="42.88px" width="180px" />
          </a>
        </div>
        <h1>Bootstrap your testnet wallet</h1>
        <span>
          MultiFaucet funds a wallet with{" "}
          <TokenLogo name="ETH" imageSrc="/tokens/eth.png" />
          , <TokenLogo name="wETH" imageSrc="/tokens/weth.png" />,
          <TokenLogo name="DAI" imageSrc="/tokens/dai.svg" />, and{" "}
          <TokenLogo name="NFTs" imageSrc="/tokens/punks.png" /> across 4
          testnet networks, at once.
        </span>
      </div>

      {/* Claim from facuet card */}
      <div className={styles.home__card}>
        {/* Card title */}
        <div className={styles.home__card_title}>
          <h3>Request Tokens</h3>
        </div>

        {/* Card content */}
        <div className={styles.home__card_content}>
          {!session ? (
            // If user is unauthenticated:
            <div className={styles.content__unauthenticated}>
              {/* Reasoning for Twitter OAuth */}
              <p>
                To prevent faucet botting, you must sign in with Twitter. We
                request{" "}
                <a
                  href="https://developer.twitter.com/en/docs/apps/app-permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  read-only
                </a>{" "}
                access.
              </p>

              {/* Sign in with Twitter */}
              <button
                className={styles.button__main}
                onClick={() => signIn("twitter")}
              >
                Sign In with Twitter
              </button>
            </div>
          ) : (
            // If user is authenticated:
            <div className={styles.content__authenticated}>
              {claimed ? (
                // If user has already claimed once in 24h
                <div className={styles.content__claimed}>
                  <p>
                    {firstClaim
                      ? "You have successfully claimed tokens. You can request again in 24 hours."
                      : "You have already claimed tokens today. Please try again in 24 hours."}
                  </p>

                  <input
                    type="text"
                    placeholder="0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B"
                    disabled
                  />
                  <button className={styles.button__main} disabled>
                    Tokens Already Claimed
                  </button>
                </div>
              ) : (
                // If user has not claimed in 24h
                <div className={styles.content__unclaimed}>
                  {/* Claim description */}
                  <p>Enter your Ethereum address to receive tokens:</p>

                  {/* Address input */}
                  <input
                    type="text"
                    placeholder="0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />

                  {isValidAddress(address) ? (
                    // If address is valid, allow claiming
                    <button
                      className={styles.button__main}
                      onClick={processClaim}
                      disabled={loading}
                    >
                      {!loading ? "Claim" : "Claiming..."}
                    </button>
                  ) : (
                    // Else, force fix
                    <button className={styles.button__main} disabled>
                      {address === ""
                        ? "Enter Valid Address"
                        : "Invalid Address"}
                    </button>
                  )}
                </div>
              )}

              {/* General among claimed or unclaimed, allow signing out */}
              <div className={styles.content__twitter}>
                <button onClick={() => signOut()}>
                  Sign out @{session.twitter_handle}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Faucet details card */}
      <div className={styles.home__card}>
        {/* Card title */}
        <div className={styles.home__card_title}>
          <h3>Faucet Details</h3>
        </div>

        {/* General information */}
        <div>
          <div className={styles.home__card_content_section}>
            <h4>General Information</h4>
            <p>
              The faucet drips 5 ETH, 5 wETH, 5,000 DAI, and 5 NFTs (ERC721).
            </p>
            <p>
              You will receive these tokens on Ropsten, Kovan, Görli, and
              Optimistic Kovan.
            </p>
            <p>You can claim from the faucet once every 24 hours.</p>
          </div>
        </div>

        {/* Network details */}
        {ADDRESSES.map((network) => {
          // For each network
          return (
            <div key={network.network}>
              <div className={styles.home__card_content_section}>
                {/* Network name */}
                <h4>
                  {network.formattedName}{" "}
                  {network.connectionDetails ? (
                    <span>
                      (
                      <a
                        href={network.connectionDetails}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        connection details
                      </a>
                      )
                    </span>
                  ) : null}
                </h4>

                {Object.entries(network.addresses).map(([name, address]) => {
                  // For each network address
                  return (
                    // Address description: address
                    <p key={name}>
                      {name}:{" "}
                      <TokenAddress
                        network={network.network}
                        name={name}
                        address={address}
                        ERC20={name != "NFTs"}
                      />
                    </p>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}

/**
 * Returns token address component
 * @param {string} network of address
 * @param {string?} name if displaying MM connect
 * @param {string} address to display
 * @param {string} ERC20 if asset is an ERC20
 * @returns {ReactElement}
 */
function TokenAddress({
  network,
  name,
  address,
  ERC20,
}: {
  network: string;
  name?: string;
  address: string;
  ERC20: boolean;
}): ReactElement {
  /**
   * Adds token to MetaMask
   */
  const addToMetaMask = async () => {
    // @ts-expect-error
    await window.ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address: address,
          symbol: name,
          decimals: 18,
        },
      },
    });
  };

  return (
    <span className={styles.address}>
      <a
        href={`https://${network}.etherscan.io/address/${address}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {ethers.utils.getAddress(address)}
      </a>
      {ERC20 ? <button onClick={addToMetaMask}>Add to MetaMask</button> : null}
    </span>
  );
}

/**
 * Returns token logo component
 * @param {string} name of token
 * @param {string} imageSrc of token image
 * @returns {ReactElement}
 */
function TokenLogo({
  name,
  imageSrc,
}: {
  name: string;
  imageSrc: string;
}): ReactElement {
  return (
    <div className={styles.token}>
      <img src={imageSrc} alt={`${name}`} />
      <span>{name}</span>
    </div>
  );
}

export async function getServerSideProps(context: any) {
  // Collect session
  const session: any = await getSession(context);

  return {
    props: {
      session,
      // If session exists, collect claim status, else return false
      claimed: session ? await hasClaimed(session.twitter_id) : false,
    },
  };
}
