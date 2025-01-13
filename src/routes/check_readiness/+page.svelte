<script lang="ts">

import type { PageData } from './$types';

let { data }: { data: PageData } = $props();

</script>

<h1>Readiness check page</h1>
<p>Is Weaviate ready?: {data.ready}</p>