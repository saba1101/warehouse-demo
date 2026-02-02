import styles from "@/styles/Home.module.scss";
function Home() {
  return (
    <main className={styles.wrapper}>
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>How to Use Demo</h1>
        <p className={styles.heroSubtitle}>
          Start with cash and a warehouse. Buy cars, fix or salvage them, trade
          with others, and grow your empire.
        </p>
      </section>

      <div className={styles.guideBands}>
        <article className={`${styles.band} ${styles.bandStart}`}>
          <div className={styles.bandIcon}>💰</div>
          <div className={styles.bandContent}>
            <h2 className={styles.bandTitle}>Your Start</h2>
            <p className={styles.bandBody}>
              You begin with starter money and your own warehouse. Use your
              capital wisely to buy inventory, upgrade space, or flip your first
              cars.
            </p>
          </div>
        </article>

        <article className={`${styles.band} ${styles.bandWarehouse}`}>
          <div className={styles.bandIcon}>🏭</div>
          <div className={styles.bandContent}>
            <h2 className={styles.bandTitle}>Warehouses</h2>
            <p className={styles.bandBody}>
              Expand or downsize your operation. Buy new warehouses to store
              more cars and parts, or sell ones you don’t need to free up cash.
            </p>
            <ul className={styles.bandList}>
              <li>Buy warehouses to increase capacity</li>
              <li>Sell warehouses to liquidate assets</li>
            </ul>
          </div>
        </article>

        <article className={`${styles.band} ${styles.bandCars}`}>
          <div className={styles.bandIcon}>🚗</div>
          <div className={styles.bandContent}>
            <h2 className={styles.bandTitle}>Cars</h2>
            <p className={styles.bandBody}>
              Purchase cars in different conditions—from beaters to near-mint.
              Salvage them for parts, fix them up, or sell as-is for quick cash.
            </p>
            <ul className={styles.bandList}>
              <li>Buy cars in various conditions</li>
              <li>Salvage for parts or fix and resell</li>
              <li>Sell repaired or as-is for profit</li>
            </ul>
          </div>
        </article>

        <article className={`${styles.band} ${styles.bandTrade}`}>
          <div className={styles.bandIcon}>🤝</div>
          <div className={styles.bandContent}>
            <h2 className={styles.bandTitle}>Trading</h2>
            <p className={styles.bandBody}>
              Trade cars with other. Negotiate deals, swap inventory, and turn
              every trade into an opportunity to make money.
            </p>
            <ul className={styles.bandList}>
              <li>Trade with other players</li>
              <li>Negotiate and close deals</li>
              <li>Grow your bankroll through smart trades</li>
            </ul>
          </div>
        </article>
      </div>

      <section className={styles.flowSection}>
        <h2 className={styles.flowTitle}>Quick flow</h2>
        <div className={styles.flowSteps}>
          <div className={styles.flowStep}>
            <span className={styles.flowNumber}>1</span>
            <div className={styles.flowContent}>
              <strong>Start</strong> with cash and a warehouse.
              <p>Use the sidebar to check your balance and navigate.</p>
            </div>
          </div>
          <div className={styles.flowStep}>
            <span className={styles.flowNumber}>2</span>
            <div className={styles.flowContent}>
              <strong>Buy cars</strong> from the marketplace in different
              conditions.
              <p>
                Cheaper beaters can be fixed or salvaged; better condition means
                faster flip.
              </p>
            </div>
          </div>
          <div className={styles.flowStep}>
            <span className={styles.flowNumber}>3</span>
            <div className={styles.flowContent}>
              <strong>Fix or salvage</strong> in your warehouse, then sell or
              trade.
              <p>Maximize profit by choosing the right path for each car.</p>
            </div>
          </div>
          <div className={styles.flowStep}>
            <span className={styles.flowNumber}>4</span>
            <div className={styles.flowContent}>
              <strong>Trade with others</strong> and buy or sell warehouses to
              scale.
              <p>Keep growing your empire and stacking cash.</p>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.cta}>
        <p className={styles.ctaText}>
          Ready to play? Head to{" "}
          <span className={styles.ctaHighlight}>Marketplace</span>,{" "}
          <span className={styles.ctaHighlight}>Warehouse</span>, or{" "}
          <span className={styles.ctaHighlight}>Trade-ins</span> in the sidebar.
        </p>
      </div>
    </main>
  );
}

export default Home;
